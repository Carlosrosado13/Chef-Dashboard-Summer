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

function normalizeNotes(notes) {
  if (notes === undefined || notes === null) {
    return [];
  }

  const noteList = Array.isArray(notes) ? notes : [notes];

  return noteList
    .filter((note) => note !== undefined && note !== null)
    .map((note) => String(note).trim())
    .filter((note) => note.length > 0);
}

export function normalizeRecipe(recipe) {
  const normalizedRecipe = {};

  if (Object.hasOwn(recipe, "title")) {
    normalizedRecipe.title = trimString(recipe.title);
  }

  if (Object.hasOwn(recipe, "yield")) {
    normalizedRecipe.yield = trimString(recipe.yield);
  }

  if (Object.hasOwn(recipe, "category")) {
    normalizedRecipe.category = trimString(recipe.category);
  }

  if (Object.hasOwn(recipe, "ingredients")) {
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    normalizedRecipe.ingredients = ingredients
      .filter((ingredient) => !isEmptyIngredient(ingredient))
      .map(normalizeIngredient);
  }

  if (Object.hasOwn(recipe, "steps")) {
    normalizedRecipe.steps = normalizeSteps(recipe.steps);
  }

  if (Object.hasOwn(recipe, "notes")) {
    normalizedRecipe.notes = normalizeNotes(recipe.notes);
  }

  return normalizedRecipe;
}
