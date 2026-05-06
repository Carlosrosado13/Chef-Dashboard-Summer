import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSession,
  requireAdminAuth
} from "./adminAuthApi.js";
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

  if (request.method === "POST" && url.pathname === "/api/admin/login") {
    return handleAdminLogin(request, env);
  }

  if (request.method === "POST" && url.pathname === "/api/admin/logout") {
    return handleAdminLogout(request);
  }

  if (request.method === "GET" && url.pathname === "/api/admin/session") {
    return handleAdminSession(request);
  }

  if (request.method === "POST" && url.pathname === "/api/recipe/validate-patch") {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return auth.response;
    }
    return handleValidatePatch(request);
  }

  if (request.method === "POST" && url.pathname === "/api/recipe/save-draft") {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return auth.response;
    }
    return handleSaveDraft(request);
  }

  if (request.method === "POST" && url.pathname === "/api/recipe/commit-patch") {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return auth.response;
    }
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
