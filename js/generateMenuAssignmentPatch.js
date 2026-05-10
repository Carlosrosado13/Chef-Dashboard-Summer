const LUNCH_CATEGORIES = ["SOUP", "SALAD", "MAIN 1", "MAIN 2", "DESSERT"];
const DINNER_CATEGORIES = ["Appetizer 1", "Appetizer 2", "Elevated", "Comfort", "Alternative", "Veggie 1", "Veggie 2", "Starch", "Dessert"];
const LEGACY_DINNER_CATEGORY_ALIASES = {
  Traditional: "Comfort",
  "Veg 1": "Veggie 1",
  "Veg 2": "Veggie 2"
};

function normalizeDinnerCategory(category) {
  const text = String(category || "").trim();

  return LEGACY_DINNER_CATEGORY_ALIASES[text] || text;
}

function getAllowedCategories(mealType, includeLegacy = false) {
  if (mealType !== "dinner") {
    return LUNCH_CATEGORIES;
  }

  return includeLegacy
    ? [...DINNER_CATEGORIES, ...Object.keys(LEGACY_DINNER_CATEGORY_ALIASES)]
    : DINNER_CATEGORIES;
}

function resolveDayMenuCategory(dayMenu, category) {
  const normalizedCategory = normalizeDinnerCategory(category);

  if (Object.hasOwn(dayMenu || {}, normalizedCategory)) {
    return normalizedCategory;
  }

  const legacyCategory = Object.entries(LEGACY_DINNER_CATEGORY_ALIASES)
    .find(([, canonicalCategory]) => canonicalCategory === normalizedCategory)?.[0];

  if (legacyCategory && Object.hasOwn(dayMenu || {}, legacyCategory)) {
    return legacyCategory;
  }

  return normalizedCategory;
}

export function createRecipeId(recipe) {
  return String(recipe.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clone(value) {
  return structuredClone(value);
}

export function getMenuOptions(menuData, mealType, week) {
  const weeks = Object.keys(menuData?.[mealType]?.weeks || {});
  const days = Object.keys(menuData?.[mealType]?.weeks?.[week]?.days || {});
  const categories = getAllowedCategories(mealType);

  return { weeks, days, categories };
}

export function validateMenuAssignment(menuData, recipes, assignment) {
  const errors = [];
  const categories = getAllowedCategories(assignment.mealType);
  const category = assignment.mealType === "dinner"
    ? normalizeDinnerCategory(assignment.category)
    : assignment.category;

  if (!["lunch", "dinner"].includes(assignment.mealType)) errors.push({ message: "Select a valid meal type." });
  if (!menuData?.[assignment.mealType]?.weeks?.[assignment.week]) errors.push({ message: "Select a valid week." });
  if (!menuData?.[assignment.mealType]?.weeks?.[assignment.week]?.days?.[assignment.day]) errors.push({ message: "Select a valid day." });
  if (!categories.includes(category)) errors.push({ message: "Select a valid menu category." });

  if (assignment.action !== "remove") {
    const recipeExists = recipes.some((recipe) => createRecipeId(recipe) === assignment.recipeId || recipe.title === assignment.recipeId);
    if (!recipeExists) errors.push({ message: "Selected recipe does not exist." });
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

export function projectMenuAssignment(menuData, assignment) {
  const projected = clone(menuData);
  const dayMenu = projected[assignment.mealType].weeks[assignment.week].days[assignment.day];
  const category = assignment.mealType === "dinner"
    ? resolveDayMenuCategory(dayMenu, assignment.category)
    : assignment.category;

  if (assignment.action === "remove") {
    dayMenu[category] = "";
  } else {
    dayMenu[category] = assignment.recipeId;
  }

  return projected;
}

export function validateProjectedMenu(projectedMenu, schema = null) {
  const errors = [];
  const allowedRootKeys = schema ? Object.keys(schema.properties || {}) : ["lunch", "dinner"];

  for (const mealType of Object.keys(projectedMenu || {})) {
    if (!allowedRootKeys.includes(mealType)) {
      errors.push({ message: `Unknown menu section is not allowed: ${mealType}.` });
    }

    const meal = projectedMenu[mealType];
    if (!meal?.weeks) errors.push({ message: `${mealType} is missing weeks.` });
    if (Object.keys(meal || {}).some((property) => property !== "weeks")) {
      errors.push({ message: `${mealType} contains an unknown property.` });
    }

    for (const [weekName, week] of Object.entries(meal?.weeks || {})) {
      if (!week.days) errors.push({ message: `${mealType}.${weekName} is missing days.` });
      if (Object.keys(week || {}).some((property) => property !== "days")) {
        errors.push({ message: `${mealType}.${weekName} contains an unknown property.` });
      }

      for (const [dayName, day] of Object.entries(week.days || {})) {
        const allowedCategories = getAllowedCategories(mealType, true);

        for (const [category, value] of Object.entries(day || {})) {
          if (!allowedCategories.includes(category)) {
            errors.push({ message: `${mealType}.${weekName}.${dayName}.${category} is not a supported menu category.` });
          }

          if (typeof value !== "string") {
            errors.push({ message: `${mealType}.${weekName}.${dayName}.${category} must be a string recipe reference.` });
          }
        }
      }
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

export function generateMenuAssignmentPatch(menuData, recipes, assignment, schema = null) {
  const assignmentValidation = validateMenuAssignment(menuData, recipes, assignment);

  if (!assignmentValidation.ok) {
    return {
      ok: false,
      blocked: true,
      operation: "assignMenuRecipe",
      reason: "Menu assignment must be valid before a patch can be generated.",
      errors: assignmentValidation.errors,
      timestamp: new Date().toISOString()
    };
  }

  const dayMenu = menuData[assignment.mealType].weeks[assignment.week].days[assignment.day];
  const category = assignment.mealType === "dinner"
    ? resolveDayMenuCategory(dayMenu, assignment.category)
    : assignment.category;
  const normalizedAssignment = {
    ...assignment,
    category
  };
  const currentValue = dayMenu[category] || "";
  const projectedMenu = projectMenuAssignment(menuData, normalizedAssignment);
  const projectedValidation = validateProjectedMenu(projectedMenu, schema);

  if (!projectedValidation.ok) {
    return {
      ok: false,
      blocked: true,
      operation: "assignMenuRecipe",
      reason: "Projected menu rotation failed validation.",
      errors: projectedValidation.errors,
      timestamp: new Date().toISOString()
    };
  }

  return {
    ok: true,
    operation: "assignMenuRecipe",
    patchType: "menu-assignment",
    source: "data/processed/clean-menu.json",
    timestamp: new Date().toISOString(),
    assignment: {
      ...normalizedAssignment,
      originalValue: currentValue,
      updatedValue: normalizedAssignment.action === "remove" ? "" : normalizedAssignment.recipeId
    },
    changedFields: {
      [`${normalizedAssignment.mealType}.weeks.${normalizedAssignment.week}.days.${normalizedAssignment.day}.${normalizedAssignment.category}`]: {
        original: currentValue,
        updated: normalizedAssignment.action === "remove" ? "" : normalizedAssignment.recipeId
      }
    },
    hasChanges: currentValue !== (normalizedAssignment.action === "remove" ? "" : normalizedAssignment.recipeId),
    projectedMenu
  };
}

export { LUNCH_CATEGORIES, DINNER_CATEGORIES, normalizeDinnerCategory };
