import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, ""));
const productionPath = path.join(root, "data", "recipes", "sample-recipes.json");
const cleanedPath = path.join(root, "recipes-cleaned.json");
const production = await readJson(productionPath);
const cleaned = await readJson(cleanedPath);
const categoryC = cleaned.filter((recipe) =>
  recipe?.metadata?.ingredientAudit?.requiresManualReview
  && Array.isArray(recipe.ingredients)
  && recipe.ingredients.length < 3
);

const normalize = (value) => String(value || "")
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

function schemaType(recipe) {
  if (!Object.hasOwn(recipe, "ingredients")) return "Missing ingredients field";
  if (typeof recipe.ingredients === "string") return "Plain text string";
  if (!Array.isArray(recipe.ingredients)) return `Unexpected ${typeof recipe.ingredients}`;
  if (recipe.ingredients.length === 0) return "Array<object> (empty)";
  const shapes = new Set(recipe.ingredients.map((ingredient) => {
    if (typeof ingredient === "string") return "string";
    if (!ingredient || typeof ingredient !== "object") return typeof ingredient;
    const keys = Object.keys(ingredient).sort().join(",");
    if ("amount" in ingredient && "unit" in ingredient && "name" in ingredient) return "object{amount,unit,name}";
    if ("qty" in ingredient || "item" in ingredient) return `object{${keys}}`;
    return `object{${keys}}`;
  }));
  return `Array<${[...shapes].join(" | ")}>`;
}

async function jsonFiles(directory) {
  const results = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", "archive", ".wrangler"].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await jsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".json")) results.push(full);
  }
  return results;
}

function findRecords(value, target, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) findRecords(item, target, found);
  } else if (value && typeof value === "object") {
    if (normalize(value.title) === target && (
      Object.hasOwn(value, "ingredients")
      || Object.hasOwn(value, "recipeIngredient")
      || Object.hasOwn(value, "items")
    )) found.push(value);
    for (const nested of Object.values(value)) findRecords(nested, target, found);
  }
  return found;
}

const files = await jsonFiles(root);
const parsedFiles = [];
for (const file of files) {
  if ([cleanedPath, productionPath].includes(file)) continue;
  try {
    parsedFiles.push({ file, data: await readJson(file) });
  } catch {
    // Non-recipe JSON that cannot be parsed is not a usable ingredient source.
  }
}

const rows = [];
const rootCauses = {
  trulyMissingIngredients: 0,
  schemaMismatch: 0,
  parserIssue: 0,
  fileMismatch: 0,
  validationBug: 0
};

for (const recipe of categoryC) {
  const target = normalize(recipe.title);
  const original = production.find((item) => normalize(item.title) === target);
  const alternateSources = [];
  for (const candidate of parsedFiles) {
    const matches = findRecords(candidate.data, target);
    for (const match of matches) {
      alternateSources.push({
        file: path.relative(root, candidate.file).replaceAll("\\", "/"),
        schema: schemaType(match),
        count: Array.isArray(match.ingredients) ? match.ingredients.length : null
      });
    }
  }

  const originalIngredients = original?.ingredients;
  const placeholderOnly = Array.isArray(originalIngredients)
    && originalIngredients.length > 0
    && originalIngredients.every((item) =>
      /recipe details pending|placeholder|ingredient needed/i.test(String(item?.name || item || ""))
    );
  const concatenated = Array.isArray(originalIngredients)
    && originalIngredients.some((item) =>
      /(?:The Sweetener|Brightener|Aromatics|Seasoning|Dressing|Sauce):\s*\d/i.test(String(item?.name || ""))
    );
  const wrongSchema = Array.isArray(originalIngredients)
    && originalIngredients.some((item) => item && typeof item === "object"
      && !("amount" in item && "unit" in item && "name" in item));
  const alternateUsable = alternateSources.find((item) => Number(item.count) >= 3);

  let failureReason;
  if (concatenated) {
    rootCauses.parserIssue++;
    failureReason = "Parser issue: multiple ingredient lines and section labels were concatenated into two schema-valid objects, so the count threshold incorrectly represents the actual ingredient content.";
  } else if (wrongSchema) {
    rootCauses.schemaMismatch++;
    failureReason = "Schema mismatch: ingredient objects use fields outside amount/unit/name.";
  } else if (alternateUsable) {
    rootCauses.fileMismatch++;
    failureReason = `File mismatch: a fuller ingredient record exists in ${alternateUsable.file}, but recipes-cleaned.json was built from the production placeholder record.`;
  } else if (placeholderOnly) {
    rootCauses.trulyMissingIngredients++;
    failureReason = "Upstream placeholder: production contained only the non-food ingredient 'Recipe details pending'. Cleanup removed it correctly, leaving an empty array, and no source recipe was available for rebuilding.";
  } else if (!original || !Object.hasOwn(original, "ingredients") || (Array.isArray(originalIngredients) && originalIngredients.length === 0)) {
    rootCauses.trulyMissingIngredients++;
    failureReason = "Truly missing: the production source had no usable ingredient data before cleanup.";
  } else {
    rootCauses.validationBug++;
    failureReason = "Validation bug or unclassified case: usable structured ingredients appear present but the recipe still failed the count check.";
  }

  rows.push({
    recipeName: recipe.title,
    ingredientCount: Array.isArray(recipe.ingredients) ? recipe.ingredients.length : "",
    ingredientSchemaType: schemaType(recipe),
    sourceFile: alternateSources.length
      ? `recipes-cleaned.json <- data/recipes/sample-recipes.json; also found in ${[...new Set(alternateSources.map((item) => item.file))].join(", ")}`
      : "recipes-cleaned.json <- data/recipes/sample-recipes.json",
    validationFailureReason: failureReason
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  categoryCRecipes: categoryC.length,
  summary: rootCauses,
  rows
};
await fs.writeFile(path.join(root, ".tmp-ingredient-validation-root-cause.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  categoryCRecipes: categoryC.length,
  summary: rootCauses,
  countDistribution: Object.fromEntries(Object.entries(Object.groupBy(rows, (row) => row.ingredientCount)).map(([key, values]) => [key, values.length]))
}, null, 2));
