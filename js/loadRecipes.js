const DEFAULT_RECIPES_URL = "data/recipes/sample-recipes.json";

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export async function loadRecipes(url = DEFAULT_RECIPES_URL) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        recipes: [],
        error: `Unable to load recipes: ${response.status} ${response.statusText}`
      };
    }

    const recipes = await response.json();

    return {
      ok: true,
      recipes: Array.isArray(recipes) ? recipes : [],
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      recipes: [],
      error: error.message || "Unable to load recipes."
    };
  }
}

export function findRecipeByTitle(recipes, title) {
  const normalizedTitle = normalizeTitle(title);

  return recipes.find((recipe) => normalizeTitle(recipe.title) === normalizedTitle) || null;
}

export { DEFAULT_RECIPES_URL };
