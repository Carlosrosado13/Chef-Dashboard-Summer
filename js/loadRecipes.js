const DEFAULT_RECIPES_URL = "data/recipes/sample-recipes.json";

function removeDietarySuffix(value) {
  return String(value || "").replace(
    /\s*\((?:\s*(?:gf|df|v|vg|nf|sf|vegan|vegetarian|gluten free|dairy free)\s*(?:\/|,|\+|&|\band\b|\s)*)+\)\s*$/gi,
    ""
  );
}

export function normalizeRecipeTitle(title) {
  return removeDietarySuffix(title)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createRecipeId(title) {
  return normalizeRecipeTitle(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function addIdentifier(identifiers, value) {
  const text = String(value || "").trim();
  const normalizedTitle = normalizeRecipeTitle(text);
  const recipeId = createRecipeId(text);

  if (text) {
    identifiers.add(text);
  }

  if (normalizedTitle) {
    identifiers.add(normalizedTitle);
  }

  if (recipeId) {
    identifiers.add(recipeId);
  }
}

function createRecipeIdentifierSet(recipeOrReference) {
  const identifiers = new Set();

  if (typeof recipeOrReference === "string") {
    addIdentifier(identifiers, recipeOrReference);
    return identifiers;
  }

  if (!recipeOrReference || typeof recipeOrReference !== "object") {
    return identifiers;
  }

  addIdentifier(identifiers, recipeOrReference.id);
  addIdentifier(identifiers, recipeOrReference.recipeId);
  addIdentifier(identifiers, recipeOrReference.slug);
  addIdentifier(identifiers, recipeOrReference.title);
  addIdentifier(identifiers, recipeOrReference.name);
  for (const alias of recipeOrReference.aliases || []) {
    addIdentifier(identifiers, alias);
  }

  return identifiers;
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
  const referenceIdentifiers = createRecipeIdentifierSet(title);

  if (!Array.isArray(recipes) || referenceIdentifiers.size === 0) {
    return null;
  }

  return recipes.find((recipe) => {
    const recipeIdentifiers = createRecipeIdentifierSet(recipe);

    for (const identifier of referenceIdentifiers) {
      if (recipeIdentifiers.has(identifier)) {
        return true;
      }
    }

    return false;
  }) || null;
}

export { DEFAULT_RECIPES_URL };
