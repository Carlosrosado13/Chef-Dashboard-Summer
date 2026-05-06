import { findRecipeByTitle, normalizeRecipeTitle } from "./loadRecipes.js";
import { categorizeIngredients } from "./categorizeIngredients.js";
import { parseQuantity, parseYieldValue, scaleRecipe } from "./scaleRecipe.js";

function normalizeIngredientName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUnit(unit) {
  return String(unit || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getWeekMenu(menuData, filters) {
  return menuData?.[filters.mealType]?.weeks?.[filters.week]?.days || {};
}

export function getMenuItemsForIngredientAggregation(menuData, filters = {}) {
  const days = getWeekMenu(menuData, filters);
  const items = [];

  for (const [dayName, dayMenu] of Object.entries(days)) {
    for (const [category, title] of Object.entries(dayMenu || {})) {
      if (!title) {
        continue;
      }

      items.push({
        day: dayName,
        category,
        title
      });
    }
  }

  return items;
}

function createIngredientEntry(ingredient, recipe, menuItem) {
  const parsedAmount = parseQuantity(ingredient.amount);

  return {
    name: String(ingredient.name || "").trim(),
    normalizedName: normalizeIngredientName(ingredient.name),
    unit: String(ingredient.unit || "").trim(),
    normalizedUnit: normalizeUnit(ingredient.unit),
    amount: parsedAmount,
    rawAmount: ingredient.amount,
    sources: [
      {
        recipe: recipe.title,
        menuItem: menuItem.title,
        day: menuItem.day,
        category: menuItem.category
      }
    ]
  };
}

function addIngredient(ingredientMap, unitIssues, ingredient, recipe, menuItem) {
  const entry = createIngredientEntry(ingredient, recipe, menuItem);

  if (!entry.normalizedName) {
    return;
  }

  const key = `${entry.normalizedName}::${entry.normalizedUnit}`;
  const existing = ingredientMap.get(key);
  const sameNameDifferentUnits = Array.from(ingredientMap.values()).filter((item) => {
    return item.normalizedName === entry.normalizedName && item.normalizedUnit !== entry.normalizedUnit;
  });

  if (sameNameDifferentUnits.length > 0) {
    unitIssues.set(entry.normalizedName, {
      name: entry.name,
      units: Array.from(new Set([entry.unit, ...sameNameDifferentUnits.map((item) => item.unit)]))
    });
  }

  if (!existing) {
    ingredientMap.set(key, entry);
    return;
  }

  if (Number.isFinite(existing.amount) && Number.isFinite(entry.amount)) {
    existing.amount += entry.amount;
  } else if (existing.amount !== entry.amount) {
    existing.amount = null;
    existing.note = "Quantities could not be totaled safely.";
  }

  existing.sources.push(...entry.sources);
}

export function aggregateIngredients(menuData, recipes, filters = {}) {
  const menuItems = getMenuItemsForIngredientAggregation(menuData, filters);
  const ingredientMap = new Map();
  const unitIssues = new Map();
  const missingRecipes = [];
  const scalingIssues = [];
  const usedRecipeTitles = new Set();
  const shouldScale = String(filters.targetYield || "").trim().length > 0;
  const hasValidTargetYield = shouldScale ? parseYieldValue(filters.targetYield) !== null : false;

  if (shouldScale && !hasValidTargetYield) {
    scalingIssues.push({
      title: "Target yield",
      message: "Enter a valid target yield greater than zero to scale aggregated ingredients."
    });
  }

  for (const menuItem of menuItems) {
    let recipe = findRecipeByTitle(recipes, menuItem.title);

    if (!recipe) {
      missingRecipes.push(menuItem);
      continue;
    }

    if (shouldScale && hasValidTargetYield) {
      const scaledResult = scaleRecipe(recipe, filters.targetYield);

      if (scaledResult.ok) {
        recipe = scaledResult.recipe;
      } else {
        scalingIssues.push({
          title: recipe.title,
          message: `Unable to scale from original yield "${recipe.yield || "missing"}".`
        });
      }
    }

    usedRecipeTitles.add(normalizeRecipeTitle(recipe.title));

    for (const ingredient of recipe.ingredients || []) {
      addIngredient(ingredientMap, unitIssues, ingredient, recipe, menuItem);
    }
  }

  const ingredients = Array.from(ingredientMap.values()).sort((first, second) => {
    return first.name.localeCompare(second.name) || first.unit.localeCompare(second.unit);
  });

  return {
    filters: {
      week: filters.week || "",
      mealType: filters.mealType || "",
      targetYield: filters.targetYield || ""
    },
    ingredients,
    categorizedIngredients: categorizeIngredients(ingredients),
    missingRecipes,
    unitIssues: Array.from(unitIssues.values()),
    scalingIssues,
    usedRecipeCount: usedRecipeTitles.size,
    menuItemCount: menuItems.length
  };
}
