import { commitRecipePatch } from "./githubRecipeCommit.js";
import { createError, jsonResponse, parseJsonRequest } from "./recipePatchApi.js";

function createTimestamp() {
  return new Date().toISOString();
}

export async function handleCommitPatch(request, env) {
  console.log(`[recipe-api] ${request.method} /api/recipe/commit-patch ${createTimestamp()}`);

  const parsed = await parseJsonRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await commitRecipePatch(parsed.data, env);

  if (!result.ok) {
    console.log(`[recipe-api] commit-patch failed ${result.status || 500} ${result.error}`);
    return createError(result.error, result.status || 500, result.details || []);
  }

  console.log(
    `[recipe-api] commit-patch success source=${result.source} branch=${result.branch} commit=${result.github.commitSha}`
  );

  return jsonResponse({
    ok: true,
    message: result.message,
    commitMessage: result.commitMessage,
    source: result.source,
    branch: result.branch,
    audit: result.audit,
    github: result.github,
    recipe: result.recipe,
    recipeIndex: result.recipeIndex,
    recipes: result.recipes,
    menu: result.menu,
    timestamp: createTimestamp()
  });
}
