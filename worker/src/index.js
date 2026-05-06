import { handleSaveDraft, handleValidatePatch } from "./recipePatchApi.js";
import { handleCommitPatch } from "./recipePatchRoutes.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function routeRequest(request, env) {
  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/api/recipe/validate-patch") {
    return handleValidatePatch(request);
  }

  if (request.method === "POST" && url.pathname === "/api/recipe/save-draft") {
    return handleSaveDraft(request);
  }

  if (request.method === "POST" && url.pathname === "/api/recipe/commit-patch") {
    return handleCommitPatch(request, env);
  }

  return jsonResponse({
    ok: false,
    error: "Route not found.",
    timestamp: new Date().toISOString()
  }, 404);
}

export default {
  fetch(request, env) {
    return routeRequest(request, env);
  }
};

export { routeRequest };
