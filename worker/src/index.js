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

const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function normalizePathname(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "");
  }

  return pathname;
}

function createCorsHeaders(request) {
  const origin = request?.headers?.get("origin") || "";
  const allowOrigin = LOCAL_DEV_ORIGIN_PATTERN.test(origin) ? origin : "*";

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, accept",
    "access-control-max-age": "86400",
    vary: "Origin"
  };
}

function jsonResponse(body, status = 200, request = null) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...createCorsHeaders(request)
    }
  });
}

function withCors(response, request) {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(createCorsHeaders(request))) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function handleOptionsRequest(request) {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(request)
  });
}

function methodNotAllowedResponse(pathname, method, allowedMethods, request) {
  console.warn(`[worker-router] ${method} ${pathname} rejected. Allowed: ${allowedMethods.join(", ")}`);

  const response = jsonResponse({
    ok: false,
    error: `Method ${method} is not allowed for ${pathname}.`,
    code: "METHOD_NOT_ALLOWED",
    allowedMethods,
    timestamp: new Date().toISOString()
  }, 405, request);

  response.headers.set("allow", allowedMethods.join(", "));
  return response;
}

async function routeRequest(request, env) {
  const url = new URL(request.url);
  const pathname = normalizePathname(url.pathname);
  const allowedMethods = ROUTES[pathname];

  console.log(`[worker-router] pathname=${pathname} request.method=${request.method} ${new Date().toISOString()}`);

  if (request.method === "OPTIONS") {
    return handleOptionsRequest(request);
  }

  if (allowedMethods && !allowedMethods.includes(request.method)) {
    return methodNotAllowedResponse(pathname, request.method, allowedMethods, request);
  }

  if (request.method === "POST" && pathname === "/api/admin/login") {
    return withCors(await handleAdminLogin(request, env), request);
  }

  if (request.method === "POST" && pathname === "/api/admin/logout") {
    return withCors(await handleAdminLogout(request), request);
  }

  if (request.method === "GET" && pathname === "/api/admin/session") {
    return withCors(handleAdminSession(request), request);
  }

  if (request.method === "POST" && pathname === "/api/recipe/validate-patch") {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return withCors(auth.response, request);
    }
    return withCors(await handleValidatePatch(request), request);
  }

  if (request.method === "POST" && pathname === "/api/recipe/save-draft") {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return withCors(auth.response, request);
    }
    return withCors(await handleSaveDraft(request), request);
  }

  if (request.method === "POST" && pathname === "/api/recipe/commit-patch") {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return withCors(auth.response, request);
    }
    return withCors(await handleCommitPatch(request, env), request);
  }

  return jsonResponse({
    ok: false,
    error: "Route not found.",
    timestamp: new Date().toISOString()
  }, 404, request);
}

export default {
  async fetch(request, env) {
    return routeRequest(request, env);
  }
};

export { createCorsHeaders, handleOptionsRequest, routeRequest };
