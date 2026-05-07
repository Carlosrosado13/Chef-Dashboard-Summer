import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSession,
  requireAdminAuth
} from "./adminAuthApi.js";
import { extractRecipeFields, extractRecipeFromHtmlDocument, normalizeRecipe } from "./extractRecipe.js";
import { handleSaveDraft, handleValidatePatch } from "./recipePatchApi.js";
import { handleCommitPatch } from "./recipePatchRoutes.js";
import { validateRecipe } from "./validateRecipe.js";

const ADMIN_LOGIN_PATH = "/api/admin/login";
const ADMIN_LOGOUT_PATH = "/api/admin/logout";
const ADMIN_SESSION_PATH = "/api/admin/session";
const RECIPE_VALIDATE_PATCH_PATH = "/api/recipe/validate-patch";
const RECIPE_SAVE_DRAFT_PATH = "/api/recipe/save-draft";
const RECIPE_COMMIT_PATCH_PATH = "/api/recipe/commit-patch";
const ADMIN_EXTRACT_URL_PATH = "/api/admin/extract-url";
const DEV_ADMIN_AUTH_BYPASS = true;

function normalizePathname(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "");
  }

  return pathname;
}

function createCorsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
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

const routeHandlers = new Map();

routeHandlers.set(`POST ${ADMIN_LOGIN_PATH}`, async (request, env) => (
  withCors(await handleAdminLogin(request, env), request)
));

routeHandlers.set(`POST ${ADMIN_LOGOUT_PATH}`, async (request) => (
  withCors(await handleAdminLogout(request), request)
));

routeHandlers.set(`GET ${ADMIN_SESSION_PATH}`, (request) => (
  withCors(handleAdminSession(request), request)
));

routeHandlers.set(`POST ${ADMIN_EXTRACT_URL_PATH}`, async (request) => {
  console.log(`[recipe-extract] ${request.method} ${ADMIN_EXTRACT_URL_PATH}`);

  if (!DEV_ADMIN_AUTH_BYPASS) {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return withCors(auth.response, request);
    }
  }

  const parsed = await request.json().catch(() => null);
  const sourceUrl = parsed?.url ? String(parsed.url).trim() : "";
  console.log(`[recipe-extract] source=${sourceUrl || "missing"}`);

  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    return jsonResponse({
      ok: false,
      error: "A valid recipe URL is required."
    }, 400, request);
  }

  let response;

  try {
    response = await fetch(sourceUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "user-agent": "ChefDashboardRecipeImporter/1.0"
      }
    });
  } catch (error) {
    console.warn(`[recipe-extract] fetch error ${error.message || error}`);
    return jsonResponse({
      ok: false,
      error: error.message || "Unable to fetch recipe URL."
    }, 502, request);
  }

  if (!response.ok) {
    console.warn(`[recipe-extract] fetch failed ${response.status} ${response.statusText}`);
    return jsonResponse({
      ok: false,
      error: `Unable to fetch recipe URL: ${response.status} ${response.statusText}`
    }, 502, request);
  }

  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();
  let recipe;

  try {
    recipe = contentType.includes("application/json")
      ? normalizeRecipe(extractRecipeFields(JSON.parse(body)))
      : extractRecipeFromHtmlDocument(body, sourceUrl);
  } catch (error) {
    console.warn(`[recipe-extract] extraction failed ${error.message || error}`);
    return jsonResponse({
      ok: false,
      error: error.message || "Unable to extract recipe data from the URL."
    }, 422, request);
  }

  const validation = validateRecipe(recipe);
  console.log(`[recipe-extract] validation=${validation.ok ? "ok" : "failed"}`);

  return jsonResponse({
    ok: true,
    recipe,
    validation
  }, 200, request);
});

routeHandlers.set(`POST ${RECIPE_VALIDATE_PATCH_PATH}`, async (request) => {
  if (!DEV_ADMIN_AUTH_BYPASS) {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return withCors(auth.response, request);
    }
  }

  return withCors(await handleValidatePatch(request), request);
});

routeHandlers.set(`POST ${RECIPE_SAVE_DRAFT_PATH}`, async (request) => {
  if (!DEV_ADMIN_AUTH_BYPASS) {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return withCors(auth.response, request);
    }
  }

  return withCors(await handleSaveDraft(request), request);
});

routeHandlers.set(`POST ${RECIPE_COMMIT_PATCH_PATH}`, async (request, env) => {
  if (!DEV_ADMIN_AUTH_BYPASS) {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return withCors(auth.response, request);
    }
  }

  return withCors(await handleCommitPatch(request, env), request);
});

function getRouteHandler(method, pathname) {
  return routeHandlers.get(`${method} ${pathname}`) || null;
}

function getAllowedMethods(pathname) {
  const methods = [];

  for (const routeKey of routeHandlers.keys()) {
    const [method, routePathname] = routeKey.split(" ");

    if (routePathname === pathname) {
      methods.push(method);
    }
  }

  return methods.length ? methods : null;
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

  console.log(request.method, pathname);

  if (request.method === "OPTIONS") {
    return handleOptionsRequest(request, pathname);
  }

  if (allowedMethods && !allowedMethods.includes(request.method)) {
    return methodNotAllowedResponse(pathname, request.method, allowedMethods, request);
  }

  const routeHandler = getRouteHandler(request.method, pathname);

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
