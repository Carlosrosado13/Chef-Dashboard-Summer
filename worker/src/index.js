import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSession,
  requireAdminAuth
} from "./adminAuthApi.js";
import { handleSaveDraft, handleValidatePatch } from "./recipePatchApi.js";
import { handleCommitPatch } from "./recipePatchRoutes.js";

const ROUTES = {
  "/api/admin/login": ["POST"],
  "/api/admin/logout": ["POST"],
  "/api/admin/session": ["GET"],
  "/api/recipe/validate-patch": ["POST"],
  "/api/recipe/save-draft": ["POST"],
  "/api/recipe/commit-patch": ["POST"]
};

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type, accept",
  "access-control-max-age": "86400"
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS
    }
  });
}

function withCors(response) {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

function methodNotAllowedResponse(pathname, method, allowedMethods) {
  console.warn(`[worker-router] ${method} ${pathname} rejected. Allowed: ${allowedMethods.join(", ")}`);

  const response = jsonResponse({
    ok: false,
    error: `Method ${method} is not allowed for ${pathname}.`,
    code: "METHOD_NOT_ALLOWED",
    allowedMethods,
    timestamp: new Date().toISOString()
  }, 405);

  response.headers.set("allow", allowedMethods.join(", "));
  return response;
}

async function routeRequest(request, env) {
  const url = new URL(request.url);
  const allowedMethods = ROUTES[url.pathname];

  console.log(`[worker-router] ${request.method} ${url.pathname} ${new Date().toISOString()}`);

  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  if (allowedMethods && !allowedMethods.includes(request.method)) {
    return methodNotAllowedResponse(url.pathname, request.method, allowedMethods);
  }

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
  async fetch(request, env) {
    return withCors(await routeRequest(request, env));
  }
};

export { routeRequest };
