import { commitRecipePatch } from "./githubRecipeCommit.js";
import { createError, jsonResponse, parseJsonRequest } from "./recipePatchApi.js";

const SAVE_PATHS = new Set(["/api/recipe/commit-patch", "/api/recipe/save"]);

function createTimestamp() {
  return new Date().toISOString();
}

export async function handleCommitPatch(request, env) {
  const pathname = new URL(request.url).pathname;
  console.log(`[recipe-api] ${request.method} ${pathname} ${createTimestamp()}`);

  if (!SAVE_PATHS.has(pathname)) {
    return createError("Recipe save route is not registered.", 404, [{ message: pathname }]);
  }

  const parsed = await parseJsonRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await commitRecipePatch(parsed.data, env);

  if (!result.ok) {
    console.log(`[recipe-api] commit-patch failed ${result.status || 500} ${result.error}`);
    return createError(result.error, result.status || 500, [
      ...(result.details || []),
      {
        message: "Commit patch rejected by worker.",
        operation: parsed.data?.patch?.operation || "",
        sourceType: typeof (parsed.data?.patch?.source || parsed.data?.source),
        menuSourceType: typeof parsed.data?.menuSource
      }
    ]);
  }

  console.log(
    `[recipe-api] commit-patch success source=${result.source} branch=${result.branch} commit=${result.github.commitSha}`
  );

  return jsonResponse({
    ok: true,
    saved: true,
    recipeId: result.recipeId,
    updatedFiles: result.updatedFiles,
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
