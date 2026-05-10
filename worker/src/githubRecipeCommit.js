import { validateRecipe } from "./validateRecipe.js";
import { validatePatchStructure } from "./recipePatchApi.js";

const DEFAULT_RECIPE_SOURCE = "data/recipes/sample-recipes.json";
const DEFAULT_MENU_SOURCE = "data/processed/clean-menu.json";

function createTimestamp() {
  return new Date().toISOString();
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  return structuredClone(value);
}

function createRecipeId(recipeOrTitle) {
  const title = typeof recipeOrTitle === "string" ? recipeOrTitle : recipeOrTitle?.title;
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeForComparison(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeForComparison);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((normalized, key) => {
        normalized[key] = normalizeForComparison(value[key]);
        return normalized;
      }, {});
  }

  return value;
}

function valuesEqual(left, right) {
  return JSON.stringify(normalizeForComparison(left)) === JSON.stringify(normalizeForComparison(right));
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeBase64(value) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function validateGithubEnv(env) {
  const missing = ["GH_TOKEN", "GH_OWNER", "GH_REPO", "GH_BRANCH"].filter((key) => !env?.[key]);

  if (missing.length > 0) {
    return missing.map((key) => ({ message: `Missing environment variable: ${key}` }));
  }

  return [];
}

function validateSourcePath(source) {
  const sourcePath = source || DEFAULT_RECIPE_SOURCE;

  if (
    sourcePath.includes("..") ||
    sourcePath.startsWith("/") ||
    !sourcePath.startsWith("data/recipes/") ||
    !sourcePath.endsWith(".json")
  ) {
    return {
      ok: false,
      errors: [{ message: "patch.source must be a JSON file inside data/recipes/" }]
    };
  }

  return {
    ok: true,
    sourcePath
  };
}

function validateMenuSourcePath(source) {
  const sourcePath = source || DEFAULT_MENU_SOURCE;

  if (
    sourcePath.includes("..") ||
    sourcePath.startsWith("/") ||
    !sourcePath.endsWith(".json") ||
    !["data/processed/clean-menu.json"].includes(sourcePath)
  ) {
    return {
      ok: false,
      errors: [{ message: "menuSource must be data/processed/clean-menu.json" }]
    };
  }

  return {
    ok: true,
    sourcePath
  };
}

function applyPatchToRecipeDataset(recipes, patch) {
  const structureErrors = validatePatchStructure(patch);

  if (structureErrors.length > 0) {
    return {
      ok: false,
      errors: structureErrors
    };
  }

  if (!Array.isArray(recipes)) {
    return {
      ok: false,
      errors: [{ message: "Recipe dataset must be an array." }]
    };
  }

  if (patch.operation === "createRecipe") {
    const recipe = cloneValue(patch.recipe);
    const validation = validateRecipe(recipe);

    if (!validation.ok) {
      return {
        ok: false,
        errors: validation.errors
      };
    }

    const updatedRecipes = cloneValue(recipes);
    updatedRecipes.push(recipe);

    return {
      ok: true,
      originalRecipe: null,
      updatedRecipe: recipe,
      updatedRecipes,
      created: true,
      index: updatedRecipes.length - 1
    };
  }

  if (patch.index >= recipes.length) {
    return {
      ok: false,
      errors: [{ message: "Patch index is outside the recipe dataset." }]
    };
  }

  const originalRecipe = cloneValue(recipes[patch.index]);
  const updatedRecipe = cloneValue(originalRecipe);
  const conflicts = [];

  for (const [field, change] of Object.entries(patch.changedFields)) {
    if (!valuesEqual(originalRecipe[field], change.original)) {
      conflicts.push({
        field,
        message: `Patch conflict on ${field}; current value does not match patch original value.`,
        current: originalRecipe[field],
        expected: change.original
      });
      continue;
    }

    updatedRecipe[field] = cloneValue(change.updated);
  }

  if (conflicts.length > 0) {
    return {
      ok: false,
      errors: conflicts
    };
  }

  const validation = validateRecipe(updatedRecipe);

  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors
    };
  }

  const updatedRecipes = cloneValue(recipes);
  updatedRecipes[patch.index] = updatedRecipe;

  return {
    ok: true,
    originalRecipe,
    updatedRecipe,
    updatedRecipes
  };
}

function applyMenuAssignment(menuData, assignment, recipeTitle, originalTitle = "") {
  if (!assignment && !originalTitle) {
    return {
      ok: true,
      updatedMenu: menuData,
      applied: false,
      changed: false
    };
  }

  const updatedMenu = cloneValue(menuData);
  const oldReferences = new Set([originalTitle, createRecipeId(originalTitle)].filter(Boolean));
  let referenceUpdateCount = 0;

  if (recipeTitle && oldReferences.size > 0 && !oldReferences.has(recipeTitle)) {
    for (const meal of Object.values(updatedMenu || {})) {
      for (const weekValue of Object.values(meal?.weeks || {})) {
        for (const dayValue of Object.values(weekValue?.days || {})) {
          for (const [slotCategory, value] of Object.entries(dayValue || {})) {
            if (oldReferences.has(value)) {
              dayValue[slotCategory] = recipeTitle;
              referenceUpdateCount += 1;
            }
          }
        }
      }
    }
  }

  let slotAssignment = null;

  if (assignment) {
    const mealType = assignment.mealType || "dinner";
    const week = assignment.week || "";
    const day = assignment.day || "";
    const category = assignment.category || "";

    if (!updatedMenu?.[mealType]?.weeks?.[week]?.days?.[day]) {
      return {
        ok: false,
        errors: [{ message: "Selected menu slot is not available." }]
      };
    }

    const updatedDayMenu = updatedMenu[mealType].weeks[week].days[day];

    if (!Object.hasOwn(updatedDayMenu, category)) {
      return {
        ok: false,
        errors: [{ message: "Selected menu category is not available." }]
      };
    }

    const originalValue = updatedDayMenu[category] || "";
    updatedDayMenu[category] = recipeTitle;
    slotAssignment = {
      mealType,
      week,
      day,
      category,
      originalValue,
      updatedValue: recipeTitle
    };
  }

  return {
    ok: true,
    updatedMenu,
    applied: true,
    changed: referenceUpdateCount > 0 || (slotAssignment && slotAssignment.originalValue !== recipeTitle),
    referenceUpdateCount,
    assignment: slotAssignment
  };
}

function createCommitMessage(patch) {
  const title = patch.updatedTitle || patch.originalTitle || `recipe ${patch.index}`;

  return `Update recipe: ${title}`;
}

async function githubRequest(url, env, options = {}) {
  const response = await fetch(url, {
    ...options,
   headers: {
  accept: "application/vnd.github+json",
  authorization: `Bearer ${env.GH_TOKEN}`,
  "content-type": "application/json",
  "x-github-api-version": "2022-11-28",
  "user-agent": "chef-dashboard-worker",
  ...(options.headers || {})
}
  });

  const text = await response.text();

  console.log("[github-api] URL:", url);
  console.log("[github-api] STATUS:", response.status);
  console.log("[github-api] RESPONSE:", text);

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (parseError) {
    data = {
      raw: text
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.raw ||
      `GitHub API request failed with ${response.status}`
    );
  }

  return data;
}

async function fetchGithubFile(env, sourcePath) {
  const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${sourcePath}?ref=${encodeURIComponent(env.GH_BRANCH)}`;
  const data = await githubRequest(url, env);

  if (data.type !== "file" || !data.content || !data.sha) {
    throw new Error("GitHub recipe source did not resolve to a file.");
  }

  return {
    sha: data.sha,
    content: decodeBase64(data.content)
  };
}

async function commitGithubFile(env, sourcePath, currentSha, content, message) {
  const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${sourcePath}`;

  return githubRequest(url, env, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      sha: currentSha,
      branch: env.GH_BRANCH
    })
  });
}

export async function commitRecipePatch(payload, env) {
  const timestamp = createTimestamp();
  const envErrors = validateGithubEnv(env);

  if (envErrors.length > 0) {
    return {
      ok: false,
      status: 500,
      error: "GitHub commit environment is not configured.",
      details: envErrors,
      timestamp
    };
  }

  if (!isRecord(payload) || !isRecord(payload.patch)) {
    return {
      ok: false,
      status: 400,
      error: "Request must include a patch object.",
      details: [{ message: "payload.patch is required" }],
      timestamp
    };
  }

  const sourceResult = validateSourcePath(payload.patch.source || payload.source);

  if (!sourceResult.ok) {
    return {
      ok: false,
      status: 400,
      error: "Recipe source path is not allowed.",
      details: sourceResult.errors,
      timestamp
    };
  }

  try {
    const menuSourceResult = validateMenuSourcePath(payload.menuSource);

    if (!menuSourceResult.ok) {
      return {
        ok: false,
        status: 400,
        error: "Menu source path is not allowed.",
        details: menuSourceResult.errors,
        timestamp
      };
    }

    const sourceFile = await fetchGithubFile(env, sourceResult.sourcePath);
    const recipes = JSON.parse(sourceFile.content);
    const applyResult = applyPatchToRecipeDataset(recipes, payload.patch);

    if (!applyResult.ok) {
      return {
        ok: false,
        status: 422,
        error: "Recipe patch could not be applied safely.",
        details: applyResult.errors,
        timestamp
      };
    }

    let menuPlan = null;
    let menuResult = {
      applied: false,
      changed: false
    };

    if (payload.menuAssignment) {
      const menuFile = await fetchGithubFile(env, menuSourceResult.sourcePath);
      const menuData = JSON.parse(menuFile.content);
      const menuApplyResult = applyMenuAssignment(
        menuData,
        payload.menuAssignment,
        applyResult.updatedRecipe.title,
        applyResult.originalRecipe?.title || payload.patch.originalTitle || ""
      );

      if (!menuApplyResult.ok) {
        return {
          ok: false,
          status: 422,
          error: "Menu assignment could not be applied.",
          details: menuApplyResult.errors,
          timestamp
        };
      }

      menuPlan = {
        file: menuFile,
        applyResult: menuApplyResult
      };
    }

    const updatedContent = `${JSON.stringify(applyResult.updatedRecipes, null, 2)}\n`;
    const commitMessage = payload.commitMessage || createCommitMessage(payload.patch);
    const commitResult = await commitGithubFile(
      env,
      sourceResult.sourcePath,
      sourceFile.sha,
      updatedContent,
      commitMessage
    );
    const commitSha = commitResult.commit?.sha || commitResult.content?.sha || "";

    if (menuPlan) {
      const menuApplyResult = menuPlan.applyResult;

      if (menuApplyResult.changed) {
        const menuCommitResult = await commitGithubFile(
          env,
          menuSourceResult.sourcePath,
          menuPlan.file.sha,
          `${JSON.stringify(menuApplyResult.updatedMenu, null, 2)}\n`,
          `Assign recipe: ${applyResult.updatedRecipe.title}`
        );

        menuResult = {
          applied: true,
          changed: true,
          source: menuSourceResult.sourcePath,
          assignment: menuApplyResult.assignment,
          github: {
            commitSha: menuCommitResult.commit?.sha || menuCommitResult.content?.sha || "",
            contentSha: menuCommitResult.content?.sha || "",
            htmlUrl: menuCommitResult.commit?.html_url || menuCommitResult.content?.html_url || ""
          }
        };
      } else {
        menuResult = {
          applied: true,
          changed: false,
          source: menuSourceResult.sourcePath,
          assignment: menuApplyResult.assignment
        };
      }
    }

    return {
      ok: true,
      message: "Recipe saved to GitHub.",
      saved: true,
      recipeId: createRecipeId(applyResult.updatedRecipe),
      updatedFiles: [
        sourceResult.sourcePath,
        ...(menuResult.changed ? [menuSourceResult.sourcePath] : [])
      ],
      commitMessage,
      source: sourceResult.sourcePath,
      branch: env.GH_BRANCH,
      audit: {
        timestamp,
        patchTimestamp: payload.patch.timestamp || "",
        appliedAt: createTimestamp(),
        originalTitle: payload.patch.originalTitle || applyResult.originalRecipe?.title || "",
        updatedTitle: payload.patch.updatedTitle || applyResult.updatedRecipe.title,
        changedFields: Object.keys(payload.patch.changedFields || {}),
        previousFileSha: sourceFile.sha,
        commitSha,
        rollback: {
          source: sourceResult.sourcePath,
          branch: env.GH_BRANCH,
          previousFileSha: sourceFile.sha,
          recipeIndex: applyResult.index ?? payload.patch.index,
          originalRecipe: applyResult.originalRecipe
        }
      },
      github: {
        commitSha,
        contentSha: commitResult.content?.sha || "",
        htmlUrl: commitResult.commit?.html_url || commitResult.content?.html_url || ""
      },
      recipe: applyResult.updatedRecipe,
      recipeIndex: applyResult.index ?? payload.patch.index,
      recipes: applyResult.updatedRecipes,
      menu: menuResult
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: "GitHub commit failed.",
      details: [{ message: error.message || "Unknown GitHub API error" }],
      timestamp
    };
  }
}

export { applyPatchToRecipeDataset, createCommitMessage };
