import { INGREDIENT_CATEGORIES, INGREDIENT_CATEGORY_KEYWORDS } from "./ingredientCategories.js";

const DEFAULT_CATEGORY = "Miscellaneous";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9&\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesKeyword(text, keyword) {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) {
    return false;
  }

  return text === normalizedKeyword || text.includes(normalizedKeyword);
}

export function categorizeIngredient(ingredient, categoryKeywords = INGREDIENT_CATEGORY_KEYWORDS) {
  const searchableText = normalizeText(`${ingredient.name || ""} ${ingredient.categoryHint || ""}`);

  for (const category of INGREDIENT_CATEGORIES) {
    if (category === DEFAULT_CATEGORY) {
      continue;
    }

    const keywords = categoryKeywords[category] || [];
    if (keywords.some((keyword) => matchesKeyword(searchableText, keyword))) {
      return category;
    }
  }

  return DEFAULT_CATEGORY;
}

export function categorizeIngredients(ingredients, options = {}) {
  const categoryKeywords = options.categoryKeywords || INGREDIENT_CATEGORY_KEYWORDS;
  const grouped = INGREDIENT_CATEGORIES.map((category) => ({
    category,
    count: 0,
    ingredients: []
  }));
  const groupMap = new Map(grouped.map((group) => [group.category, group]));

  for (const ingredient of ingredients || []) {
    const category = categorizeIngredient(ingredient, categoryKeywords);
    const group = groupMap.get(category) || groupMap.get(DEFAULT_CATEGORY);
    const categorizedIngredient = {
      ...ingredient,
      purchaseCategory: group.category
    };

    group.ingredients.push(categorizedIngredient);
    group.count += 1;
  }

  return grouped.filter((group) => group.count > 0);
}

export { DEFAULT_CATEGORY };
