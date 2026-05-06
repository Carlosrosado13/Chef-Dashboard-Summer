import { normalizeUnit } from "./unitMap.js";

function trimString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function normalizeAmount(amount) {
  if (typeof amount === "number") {
    return amount;
  }

  if (typeof amount === "string") {
    const parsedAmount = Number(amount.trim());
    return Number.isFinite(parsedAmount) ? parsedAmount : amount.trim();
  }

  return amount;
}

function isEmptyIngredient(ingredient) {
  if (!ingredient || typeof ingredient !== "object") {
    return true;
  }

  return ["name", "amount", "unit"].every((field) => {
    const value = ingredient[field];
    return value === undefined || value === null || trimString(value) === "";
  });
}

function normalizeIngredient(ingredient) {
  return {
    name: trimString(ingredient.name) || "",
    amount: normalizeAmount(ingredient.amount),
    unit: normalizeUnit(ingredient.unit)
  };
}

function normalizeSteps(steps) {
  const stepList = Array.isArray(steps) ? steps : [steps];

  return stepList
    .filter((step) => step !== undefined && step !== null)
    .map((step) => String(step).trim())
    .filter((step) => step.length > 0);
}

export function normalizeRecipe(recipe) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

  return {
    title: trimString(recipe.title) || "",
    yield: trimString(recipe.yield) || "",
    category: trimString(recipe.category) || "",
    ingredients: ingredients
      .filter((ingredient) => !isEmptyIngredient(ingredient))
      .map(normalizeIngredient),
    steps: normalizeSteps(recipe.steps)
  };
}
