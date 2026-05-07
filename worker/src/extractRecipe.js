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

function extractListByClassHint(html, hints) {
  const hintPattern = hints.join("|");
  const itemPattern = new RegExp(`<[^>]+class=["'][^"']*(?:${hintPattern})[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "gi");

  return [...html.matchAll(itemPattern)]
    .map((match) => stripHtml(match[1]))
    .filter((value) => value.length > 0);
}

export function extractRecipeFromHtml(html, sourceUrl = "") {
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

  return {
    title: firstDefined(getMetaContent(html, "og:title"), getFirstTagText(html, "h1"), getFirstTagText(html, "title")),
    yield: firstDefined(getMetaContent(html, "recipe:yield"), getMetaContent(html, "servings"), ""),
    category: firstDefined(getMetaContent(html, "article:section"), ""),
    ingredients: extractListByClassHint(html, ["ingredient", "ingredients"]).map(parseIngredientText),
    steps: extractListByClassHint(html, ["instruction", "instructions", "direction", "directions", "method"]),
    notes: [
      getMetaContent(html, "description"),
      sourceUrl ? `Imported from ${sourceUrl}` : ""
    ].filter(Boolean)
  };
}

export function extractRecipeFromHtmlDocument(html, sourceUrl = "") {
  return normalizeRecipe(extractRecipeFromHtml(html, sourceUrl));
}

export { normalizeRecipe };
