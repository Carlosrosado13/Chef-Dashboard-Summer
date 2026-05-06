import { normalizeRecipe } from "./normalizeRecipe.js";
import { validateRecipe } from "./validateRecipe.js";

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function mapIngredient(rawIngredient) {
  if (!rawIngredient || typeof rawIngredient !== "object") {
    return rawIngredient;
  }

  return {
    name: firstDefined(rawIngredient.name, rawIngredient.ingredient, rawIngredient.item),
    amount: firstDefined(rawIngredient.amount, rawIngredient.quantity, rawIngredient.qty),
    unit: firstDefined(rawIngredient.unit, rawIngredient.measure, rawIngredient.uom)
  };
}

function mapRawRecipe(rawRecipe) {
  const rawIngredients = firstDefined(rawRecipe.ingredients, rawRecipe.items, []);

  return {
    title: firstDefined(rawRecipe.title, rawRecipe.name),
    yield: firstDefined(rawRecipe.yield, rawRecipe.servings, rawRecipe.portions),
    category: firstDefined(rawRecipe.category, rawRecipe.type, rawRecipe.section),
    ingredients: Array.isArray(rawIngredients) ? rawIngredients.map(mapIngredient) : [],
    steps: firstDefined(rawRecipe.steps, rawRecipe.method, rawRecipe.instructions, [])
  };
}

export function extractRecipe(rawRecipe) {
  if (!rawRecipe || typeof rawRecipe !== "object" || Array.isArray(rawRecipe)) {
    throw new TypeError("Recipe input must be a JSON object.");
  }

  const normalizedRecipe = normalizeRecipe(mapRawRecipe(rawRecipe));
  const result = validateRecipe(normalizedRecipe);

  if (!result.ok) {
    const messages = result.errors.map((error) => error.message).join("; ");
    throw new Error(`Extracted recipe does not match recipe.schema.json: ${messages}`);
  }

  return normalizedRecipe;
}

export { normalizeRecipe };
