import { normalizeRecipe } from "./normalizeRecipe.js";
import { validateRecipe } from "./validateRecipe.js";

const INGREDIENT_UNIT_PATTERN = [
  "tablespoons?",
  "tbsp",
  "teaspoons?",
  "tsp",
  "cups?",
  "ounces?",
  "oz",
  "pounds?",
  "lbs?",
  "lb",
  "grams?",
  "g",
  "kilograms?",
  "kg",
  "milliliters?",
  "ml",
  "liters?",
  "l",
  "quarts?",
  "qt",
  "pints?",
  "pt",
  "gallons?",
  "gal",
  "cans?",
  "each",
  "pinch",
  "cloves?",
  "bunch(?:es)?"
].join("|");

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstNonEmpty(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(value) {
  if (typeof value === "number") {
    return value;
  }

  const text = String(value || "")
    .trim()
    .replace("¼", "1/4")
    .replace("½", "1/2")
    .replace("¾", "3/4")
    .replace("⅓", "1/3")
    .replace("⅔", "2/3")
    .replace("⅛", "1/8")
    .replace("⅜", "3/8")
    .replace("⅝", "5/8")
    .replace("⅞", "7/8");

  if (!text) {
    return 0;
  }

  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }

  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIngredientText(rawIngredient) {
  const text = stripHtml(rawIngredient);
  const match = text.match(new RegExp(`^([\\d./\\s¼½¾⅓⅔⅛⅜⅝⅞-]+)?\\s*(${INGREDIENT_UNIT_PATTERN})?\\b\\s*(.*)$`, "i"));

  if (!match || (!match[1] && !match[2])) {
    return {
      name: text,
      amount: 0,
      unit: ""
    };
  }

  return {
    name: (match[3] || text).trim(),
    amount: parseAmount((match[1] || "").split("-")[0].trim()),
    unit: (match[2] || "").trim()
  };
}

function mapIngredient(rawIngredient) {
  if (typeof rawIngredient === "string") {
    return parseIngredientText(rawIngredient);
  }

  if (!rawIngredient || typeof rawIngredient !== "object") {
    return rawIngredient;
  }

  return {
    name: firstDefined(rawIngredient.name, rawIngredient.ingredient, rawIngredient.item),
    amount: firstDefined(rawIngredient.amount, rawIngredient.quantity, rawIngredient.qty),
    unit: firstDefined(rawIngredient.unit, rawIngredient.measure, rawIngredient.uom)
  };
}

export function extractRecipeFields(rawRecipe) {
  if (!rawRecipe || typeof rawRecipe !== "object" || Array.isArray(rawRecipe)) {
    throw new TypeError("Recipe input must be a JSON object.");
  }

  const rawIngredients = firstDefined(rawRecipe.ingredients, rawRecipe.recipeIngredient, rawRecipe.items, []);
  const rawSteps = firstDefined(rawRecipe.steps, rawRecipe.method, rawRecipe.instructions, rawRecipe.recipeInstructions, []);

  return {
    title: firstDefined(rawRecipe.title, rawRecipe.name),
    yield: firstDefined(rawRecipe.yield, rawRecipe.recipeYield, rawRecipe.servings, rawRecipe.portions),
    category: firstDefined(rawRecipe.category, rawRecipe.recipeCategory, rawRecipe.type, rawRecipe.section),
    ingredients: Array.isArray(rawIngredients) ? rawIngredients.map(mapIngredient) : [],
    steps: Array.isArray(rawSteps) ? rawSteps.map(mapInstruction).filter(Boolean) : rawSteps,
    notes: firstDefined(rawRecipe.notes, rawRecipe.description, rawRecipe.recipeNotes, [])
  };
}

export function extractRecipe(rawRecipe) {
  const normalizedRecipe = normalizeRecipe(extractRecipeFields(rawRecipe));
  const result = validateRecipe(normalizedRecipe);

  if (!result.ok) {
    const messages = result.errors.map((error) => error.message).join("; ");
    throw new Error(`Extracted recipe does not match recipe.schema.json: ${messages}`);
  }

  return normalizedRecipe;
}

function getJsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter(Boolean)
    .flatMap((jsonText) => {
      try {
        return [JSON.parse(jsonText)];
      } catch {
        return [];
      }
    });
}

function flattenJsonLd(value) {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return [value, ...flattenJsonLd(value["@graph"] || [])];
}

function isRecipeNode(node) {
  const type = node?.["@type"];
  return Array.isArray(type) ? type.includes("Recipe") : type === "Recipe";
}

function mapInstruction(instruction) {
  if (typeof instruction === "string") {
    return stripHtml(instruction);
  }

  if (!instruction || typeof instruction !== "object") {
    return "";
  }

  if (Array.isArray(instruction.itemListElement)) {
    return instruction.itemListElement.map(mapInstruction).filter(Boolean).join(" ");
  }

  return stripHtml(firstDefined(instruction.text, instruction.name, ""));
}

function normalizeExtractedTextField(value, fallback = "") {
  if (Array.isArray(value)) {
    return normalizeExtractedTextField(value[0], fallback);
  }

  if (value && typeof value === "object") {
    return normalizeExtractedTextField(
      firstDefined(value.name, value.text, value.value, value.label),
      fallback
    );
  }

  const text = value === undefined || value === null ? "" : stripHtml(value);
  return text || fallback;
}

function formatIngredientLine(ingredient) {
  if (typeof ingredient === "string") {
    return stripHtml(ingredient);
  }

  if (!ingredient || typeof ingredient !== "object") {
    return "";
  }

  const amount = normalizeExtractedTextField(firstDefined(ingredient.amount, ingredient.quantity, ingredient.qty));
  const unit = normalizeExtractedTextField(firstDefined(ingredient.unit, ingredient.measure, ingredient.uom));
  const name = normalizeExtractedTextField(firstDefined(ingredient.name, ingredient.ingredient, ingredient.item));

  return [amount, unit, name].filter(Boolean).join(" ").trim();
}

function normalizeExtractedIngredients(ingredients) {
  const ingredientList = Array.isArray(ingredients) ? ingredients : [ingredients];

  return ingredientList
    .map(formatIngredientLine)
    .filter((ingredient) => ingredient.length > 0);
}

function normalizeExtractedSteps(steps) {
  const stepList = Array.isArray(steps) ? steps : [steps];

  return stepList
    .map(mapInstruction)
    .filter((step) => step.length > 0);
}

export function normalizeExtractedRecipeForEditor(recipe) {
  return {
    title: normalizeExtractedTextField(firstDefined(recipe?.title, recipe?.name)),
    category: normalizeExtractedTextField(
      firstDefined(recipe?.category, recipe?.recipeCategory, recipe?.type, recipe?.section),
      "Comfort"
    ),
    yield: normalizeExtractedTextField(
      firstDefined(recipe?.yield, recipe?.recipeYield, recipe?.servings, recipe?.portions),
      "24 servings"
    ),
    ingredients: normalizeExtractedIngredients(
      firstDefined(recipe?.ingredients, recipe?.recipeIngredient, recipe?.items, [])
    ),
    steps: normalizeExtractedSteps(
      firstDefined(recipe?.steps, recipe?.method, recipe?.instructions, recipe?.recipeInstructions, [])
    )
  };
}

function getMetaContent(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const match = html.match(pattern);
  return match ? stripHtml(match[1]) : "";
}

function getFirstTagText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function getHostName(sourceUrl = "") {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function decodeHtmlAttribute(value = "") {
  return stripHtml(value)
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));
}

function getAttribute(tag, attributeName) {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`${escapedName}=["']([^"']+)["']`, "i"));
  return match ? decodeHtmlAttribute(match[1]) : "";
}

function extractListByClassHint(html, hints) {
  const hintPattern = hints.join("|");
  const itemPattern = new RegExp(`<[^>]+class=["'][^"']*(?:${hintPattern})[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "gi");

  return [...html.matchAll(itemPattern)]
    .map((match) => stripHtml(match[1]))
    .filter((value) => value.length > 0);
}

function extractByItemProp(html, itemPropNames) {
  const propPattern = itemPropNames.join("|");
  const elementPattern = new RegExp(`<(?<tag>[a-z0-9-]+)[^>]+itemprop=["'](?:${propPattern})["'][^>]*>(?<body>[\\s\\S]*?)<\\/\\k<tag>>`, "gi");
  const metaPattern = new RegExp(`<meta[^>]+itemprop=["'](?:${propPattern})["'][^>]+content=["']([^"']+)["'][^>]*>`, "gi");
  const values = [];

  for (const match of html.matchAll(metaPattern)) {
    values.push(decodeHtmlAttribute(match[1]));
  }

  for (const match of html.matchAll(elementPattern)) {
    values.push(stripHtml(match.groups?.body || ""));
  }

  return values.filter(Boolean);
}

function extractFirstByItemProp(html, itemPropNames) {
  return extractByItemProp(html, itemPropNames)[0] || "";
}

function extractByDataAttribute(html, attributeHints) {
  const hintPattern = attributeHints.join("|");
  const pattern = new RegExp(`<(?<tag>[a-z0-9-]+)[^>]+data-[^=]*=["'][^"']*(?:${hintPattern})[^"']*["'][^>]*>(?<body>[\\s\\S]*?)<\\/\\k<tag>>`, "gi");

  return [...html.matchAll(pattern)]
    .map((match) => stripHtml(match.groups?.body || ""))
    .filter(Boolean);
}

function extractMicrodataRecipe(html, sourceUrl = "") {
  const ingredients = extractByItemProp(html, ["recipeIngredient", "ingredients"]).map(parseIngredientText);
  const steps = extractByItemProp(html, ["recipeInstructions", "instructions"]).map(mapInstruction).filter(Boolean);

  if (!ingredients.length && !steps.length) {
    return null;
  }

  return {
    title: firstNonEmpty(extractFirstByItemProp(html, ["name"]), getMetaContent(html, "og:title"), getFirstTagText(html, "h1")),
    yield: firstNonEmpty(extractFirstByItemProp(html, ["recipeYield", "yield"]), getMetaContent(html, "recipe:yield"), ""),
    category: firstDefined(extractFirstByItemProp(html, ["recipeCategory"]), getMetaContent(html, "article:section"), ""),
    ingredients,
    steps,
    notes: [
      firstDefined(extractFirstByItemProp(html, ["description"]), getMetaContent(html, "description")),
      sourceUrl ? `Imported from ${sourceUrl}` : ""
    ].filter(Boolean)
  };
}

function getDomainHints(sourceUrl = "") {
  const host = getHostName(sourceUrl);

  if (host.includes("foodnetwork.com")) {
    return {
      ingredients: ["o-Ingredients__a-Ingredient", "ingredient", "ingredients", "recipe-ingredients"],
      steps: ["o-Method__m-Step", "direction", "directions", "instruction", "instructions", "method"],
      yield: ["recipe-yield", "o-RecipeInfo__a-Description"]
    };
  }

  if (host.includes("allrecipes.com")) {
    return {
      ingredients: ["mm-recipes-structured-ingredients__list-item", "ingredients-item", "ingredient"],
      steps: ["comp mntl-sc-block mntl-sc-block-html", "mntl-sc-block", "instructions-section-item", "direction"],
      yield: ["recipe-servings", "mntl-recipe-details__value"]
    };
  }

  if (host.includes("bbcgoodfood.com")) {
    return {
      ingredients: ["ingredients-list__item", "recipe__ingredients", "ingredient"],
      steps: ["method-steps__list-item", "recipe__method-steps", "method", "step"],
      yield: ["post-header__servings", "recipe__meta"]
    };
  }

  if (host.includes("simplyrecipes.com")) {
    return {
      ingredients: ["structured-ingredients__list-item", "ingredient"],
      steps: ["comp mntl-sc-block", "mntl-sc-block", "method", "instruction", "direction"],
      yield: ["recipe-serving", "mntl-recipe-details__value"]
    };
  }

  return {
    ingredients: ["recipeIngredient", "recipe-ingredient", "ingredients-item", "ingredient", "ingredients"],
    steps: ["recipeInstructions", "recipe-instruction", "instructions-item", "instruction", "directions", "direction", "method", "step"],
    yield: ["recipe-yield", "servings", "yield"]
  };
}

function extractDomFallbackRecipe(html, sourceUrl = "") {
  const hints = getDomainHints(sourceUrl);
  const ingredients = [
    ...extractListByClassHint(html, hints.ingredients),
    ...extractByDataAttribute(html, hints.ingredients)
  ].map(parseIngredientText);
  const steps = [
    ...extractListByClassHint(html, hints.steps),
    ...extractByDataAttribute(html, hints.steps)
  ].map(stripHtml).filter(Boolean);
  const yieldValue = firstDefined(
    extractListByClassHint(html, hints.yield)[0],
    getMetaContent(html, "recipe:yield"),
    getMetaContent(html, "servings"),
    ""
  );

  if (!ingredients.length && !steps.length) {
    return null;
  }

  return {
    title: firstNonEmpty(getMetaContent(html, "og:title"), getFirstTagText(html, "h1"), getFirstTagText(html, "title")),
    yield: yieldValue,
    category: firstDefined(getMetaContent(html, "article:section"), ""),
    ingredients,
    steps,
    notes: [
      getMetaContent(html, "description"),
      sourceUrl ? `Imported from ${sourceUrl}` : ""
    ].filter(Boolean)
  };
}

function isAntiBotHtml(html, sourceUrl = "") {
  const text = stripHtml(html).toLowerCase();
  const host = getHostName(sourceUrl);
  const antiBotPatterns = [
    "access denied",
    "are you a human",
    "verify you are human",
    "checking your browser",
    "enable javascript and cookies",
    "temporarily unavailable",
    "unusual traffic",
    "bot detection",
    "blocked automated",
    "request blocked",
    "akamai",
    "perimeterx",
    "datadome",
    "cloudflare ray id"
  ];

  return antiBotPatterns.some((pattern) => text.includes(pattern))
    || (host.includes("foodnetwork.com") && text.includes("forbidden"));
}

export function extractRecipeFromHtml(html, sourceUrl = "") {
  if (isAntiBotHtml(html, sourceUrl)) {
    throw new Error("Website blocked automated access");
  }

  const jsonLdRecipes = getJsonLdBlocks(html)
    .flatMap(flattenJsonLd)
    .find(isRecipeNode);

  if (jsonLdRecipes) {
    return {
      title: jsonLdRecipes.name,
      yield: firstDefined(jsonLdRecipes.recipeYield, jsonLdRecipes.yield),
      category: firstDefined(jsonLdRecipes.recipeCategory, jsonLdRecipes.category),
      ingredients: (jsonLdRecipes.recipeIngredient || jsonLdRecipes.ingredients || []).map(mapIngredient),
      steps: (Array.isArray(jsonLdRecipes.recipeInstructions)
        ? jsonLdRecipes.recipeInstructions
        : [jsonLdRecipes.recipeInstructions]).map(mapInstruction).filter(Boolean),
      notes: [
        firstDefined(jsonLdRecipes.description, jsonLdRecipes.notes),
        sourceUrl ? `Imported from ${sourceUrl}` : ""
      ].filter(Boolean)
    };
  }

  const microdataRecipe = extractMicrodataRecipe(html, sourceUrl);
  if (microdataRecipe) {
    return microdataRecipe;
  }

  const fallbackRecipe = extractDomFallbackRecipe(html, sourceUrl);
  if (fallbackRecipe) {
    return fallbackRecipe;
  }

  const host = getHostName(sourceUrl);
  if (host.includes("foodnetwork.com") || host.includes("allrecipes.com") || host.includes("bbcgoodfood.com") || host.includes("simplyrecipes.com")) {
    throw new Error("Recipe schema not found");
  }

  throw new Error("Unsupported recipe website");
}

export function extractRecipeFromHtmlDocument(html, sourceUrl = "") {
  return normalizeExtractedRecipeForEditor(extractRecipeFromHtml(html, sourceUrl));
}

export { normalizeRecipe };
