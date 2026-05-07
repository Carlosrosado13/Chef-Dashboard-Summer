import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSession,
  requireAdminAuth
} from "./adminAuthApi.js";
import { handleSaveDraft, handleValidatePatch } from "./recipePatchApi.js";
import { handleCommitPatch } from "./recipePatchRoutes.js";

const ADMIN_LOGIN_PATH = "/api/admin/login";
const ADMIN_LOGOUT_PATH = "/api/admin/logout";
const ADMIN_SESSION_PATH = "/api/admin/session";
const RECIPE_VALIDATE_PATCH_PATH = "/api/recipe/validate-patch";
const RECIPE_SAVE_DRAFT_PATH = "/api/recipe/save-draft";
const RECIPE_COMMIT_PATCH_PATH = "/api/recipe/commit-patch";

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

const ROUTE_HANDLERS = {
  [ADMIN_LOGIN_PATH]: {
    POST: async (request, env) => withCors(await handleAdminLogin(request, env), request)
  },
  [ADMIN_LOGOUT_PATH]: {
    POST: async (request) => withCors(await handleAdminLogout(request), request)
  },
  [ADMIN_SESSION_PATH]: {
    GET: (request) => withCors(handleAdminSession(request), request)
  },
  [RECIPE_VALIDATE_PATCH_PATH]: {
    POST: async (request) => {
      const auth = requireAdminAuth(request);
      if (!auth.ok) {
        return withCors(auth.response, request);
      }

      return withCors(await handleValidatePatch(request), request);
    }
  },
  [RECIPE_SAVE_DRAFT_PATH]: {
    POST: async (request) => {
      const auth = requireAdminAuth(request);
      if (!auth.ok) {
        return withCors(auth.response, request);
      }

      return withCors(await handleSaveDraft(request), request);
    }
  },
  [RECIPE_COMMIT_PATCH_PATH]: {
    POST: async (request, env) => {
      const auth = requireAdminAuth(request);
      if (!auth.ok) {
        return withCors(auth.response, request);
      }

      return withCors(await handleCommitPatch(request, env), request);
    }
  }
};

function getAllowedMethods(pathname) {
  return ROUTE_HANDLERS[pathname] ? Object.keys(ROUTE_HANDLERS[pathname]) : null;
}

function handleOptionsRequest(request, pathname = "") {
  const allowedWithOptions = [...new Set([...(getAllowedMethods(pathname) || ["GET", "POST"]), "OPTIONS"])];
  const response = jsonResponse({
    ok: true,
    method: "OPTIONS",
    pathname,
    allowedMethods: allowedWithOptions,
    timestamp: new Date().toISOString()
  }, 200, request);

  response.headers.set("allow", allowedWithOptions.join(", "));
  return response;
}

function methodNotAllowedResponse(pathname, method, allowedMethods, request) {
  const allowedWithOptions = [...new Set([...allowedMethods, "OPTIONS"])];
  console.warn(`[worker-router] ${method} ${pathname} rejected. Allowed: ${allowedWithOptions.join(", ")}`);

  const response = jsonResponse({
    ok: false,
    error: `Method ${method} is not allowed for ${pathname}.`,
    code: "METHOD_NOT_ALLOWED",
    method,
    pathname,
    allowedMethods: allowedWithOptions,
    timestamp: new Date().toISOString()
  }, 405, request);

  response.headers.set("allow", allowedWithOptions.join(", "));
  return response;
}

async function routeRequest(request, env) {
  const url = new URL(request.url);
  const pathname = normalizePathname(url.pathname);
  const allowedMethods = getAllowedMethods(pathname);

  console.log(`[worker-router] pathname=${pathname} request.method=${request.method} ${new Date().toISOString()}`);

  if (request.method === "OPTIONS") {
    return handleOptionsRequest(request, pathname);
  }

  if (allowedMethods && !allowedMethods.includes(request.method)) {
    return methodNotAllowedResponse(pathname, request.method, allowedMethods, request);
  }

  const routeHandler = ROUTE_HANDLERS[pathname]?.[request.method];

  if (routeHandler) {
    return routeHandler(request, env);
  }

  return jsonResponse({
    ok: false,
    error: "Route not found.",
    code: "ROUTE_NOT_FOUND",
    pathname,
    timestamp: new Date().toISOString()
  }, 404, request);
}

export default {
  async fetch(request, env) {
    return routeRequest(request, env);
  }
};

export { ADMIN_LOGIN_PATH, createCorsHeaders, handleOptionsRequest, routeRequest };
