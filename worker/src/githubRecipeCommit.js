import { validateRecipe } from "./validateRecipe.js";
import { validatePatchStructure } from "./recipePatchApi.js";

const DEFAULT_RECIPE_SOURCE = "data/recipes/sample-recipes.json";

function createTimestamp() {
  return new Date().toISOString();
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  return structuredClone(value);
}

function valuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `GitHub API request failed with ${response.status}`);
  }

  return data;
}

async function fetchRecipeFile(env, sourcePath) {
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

async function commitRecipeFile(env, sourcePath, currentSha, content, message) {
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
    const sourceFile = await fetchRecipeFile(env, sourceResult.sourcePath);
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

    const updatedContent = `${JSON.stringify(applyResult.updatedRecipes, null, 2)}\n`;
    const commitMessage = payload.commitMessage || createCommitMessage(payload.patch);
    const commitResult = await commitRecipeFile(
      env,
      sourceResult.sourcePath,
      sourceFile.sha,
      updatedContent,
      commitMessage
    );
    const commitSha = commitResult.commit?.sha || commitResult.content?.sha || "";

    return {
      ok: true,
      message: "Recipe patch committed to GitHub.",
      commitMessage,
      source: sourceResult.sourcePath,
      branch: env.GH_BRANCH,
      audit: {
        timestamp,
        patchTimestamp: payload.patch.timestamp || "",
        appliedAt: createTimestamp(),
        originalTitle: payload.patch.originalTitle || applyResult.originalRecipe.title,
        updatedTitle: payload.patch.updatedTitle || applyResult.updatedRecipe.title,
        changedFields: Object.keys(payload.patch.changedFields || {}),
        previousFileSha: sourceFile.sha,
        commitSha,
        rollback: {
          source: sourceResult.sourcePath,
          branch: env.GH_BRANCH,
          previousFileSha: sourceFile.sha,
          recipeIndex: payload.patch.index,
          originalRecipe: applyResult.originalRecipe
        }
      },
      github: {
        commitSha,
        contentSha: commitResult.content?.sha || "",
        htmlUrl: commitResult.commit?.html_url || commitResult.content?.html_url || ""
      }
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
