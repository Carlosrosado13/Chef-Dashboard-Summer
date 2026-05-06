import { handleSaveDraft, handleValidatePatch } from "./recipePatchApi.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function routeRequest(request) {
  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/api/recipe/validate-patch") {
    return handleValidatePatch(request);
  }

  if (request.method === "POST" && url.pathname === "/api/recipe/save-draft") {
    return handleSaveDraft(request);
  }

  return jsonResponse({
    ok: false,
    error: "Route not found.",
    timestamp: new Date().toISOString()
  }, 404);
}

export default {
  fetch(request) {
    return routeRequest(request);
  }
};

export { routeRequest };
