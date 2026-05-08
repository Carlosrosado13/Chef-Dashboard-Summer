import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSession,
  requireAdminAuth
} from "./adminAuthApi.js";
import { extractRecipeFromHtmlDocument } from "./extractRecipe.js";
import { handleSaveDraft, handleValidatePatch } from "./recipePatchApi.js";
import { handleCommitPatch } from "./recipePatchRoutes.js";
import { validateRecipe } from "./validateRecipe.js";

const ADMIN_LOGIN_PATH = "/api/admin/login";
const ADMIN_LOGOUT_PATH = "/api/admin/logout";
const ADMIN_SESSION_PATH = "/api/admin/session";
const RECIPE_VALIDATE_PATCH_PATH = "/api/recipe/validate-patch";
const RECIPE_SAVE_DRAFT_PATH = "/api/recipe/save-draft";
const RECIPE_COMMIT_PATCH_PATH = "/api/recipe/commit-patch";
const RECIPE_SAVE_PATH = "/api/recipe/save";
const ADMIN_EXTRACT_URL_PATH = "/api/admin/extract-url";
const DEV_ADMIN_AUTH_BYPASS = true;
const RECIPE_FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.google.com/",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "cross-site",
  "Sec-Fetch-User": "?1"
};

function normalizePathname(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "");
  }

  return pathname;
}

function createCorsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

function jsonResponse(body, status = 200, request = null) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      ...createCorsHeaders(request)
    }
  });
}

function optionsResponse(request, allowedMethods) {
  const allowedWithOptions = [...new Set([...allowedMethods, "OPTIONS"])];
  const response = new Response(null, {
    status: 204,
    headers: {
      ...createCorsHeaders(request),
      allow: allowedWithOptions.join(", ")
    }
  });

  response.headers.set("Access-Control-Allow-Methods", allowedWithOptions.join(","));
  return response;
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

async function handleExtractRecipeUrl(request) {
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
    console.log("Fetching recipe URL:", sourceUrl);
    response = await fetch(sourceUrl, {
      headers: RECIPE_FETCH_HEADERS
    });
    console.log("Response status:", response.status);
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

  const html = await response.text();
  let recipe;

  try {
    recipe = extractRecipeFromHtmlDocument(html, sourceUrl);
  } catch (error) {
    console.warn(`[recipe-extract] extraction failed ${error.message || error}`);
    return jsonResponse({
      ok: false,
      error: error.message || "Unable to extract recipe data from the URL."
    }, 422, request);
  }

  const validation = validateRecipe(recipe);
  console.log(`[recipe-extract] validation=${validation.ok ? "ok" : "failed"}`);

  if (!validation.ok) {
    return jsonResponse({
      ok: false,
      error: validation.errors.map((error) => error.message).join("; ") || "Extracted recipe failed validation."
    }, 422, request);
  }

  return jsonResponse({
    ok: true,
    recipe,
    validation
  }, 200, request);
}

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

async function handleRecipeSaveRequest(request, env) {
  if (!DEV_ADMIN_AUTH_BYPASS) {
    const auth = requireAdminAuth(request);
    if (!auth.ok) {
      return withCors(auth.response, request);
    }
  }

  return withCors(await handleCommitPatch(request, env), request);
}

routeHandlers.set(`POST ${RECIPE_COMMIT_PATCH_PATH}`, handleRecipeSaveRequest);
routeHandlers.set(`POST ${RECIPE_SAVE_PATH}`, handleRecipeSaveRequest);

function isRecipeSavePath(pathname) {
  return pathname === RECIPE_COMMIT_PATCH_PATH || pathname === RECIPE_SAVE_PATH;
}

function routeRecipeSavePath(request, env, pathname) {
  if (request.method !== "POST") {
    return methodNotAllowedResponse(pathname, request.method, ["POST"], request);
  }

  return handleRecipeSaveRequest(request, env);
}

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
  const allowedMethods = pathname === ADMIN_EXTRACT_URL_PATH
    ? ["POST"]
    : (getAllowedMethods(pathname) || ["GET", "POST"]);

  return optionsResponse(request, allowedMethods);
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

  if (pathname === ADMIN_EXTRACT_URL_PATH) {
    if (request.method !== "POST") {
      return methodNotAllowedResponse(pathname, request.method, ["POST"], request);
    }

    return handleExtractRecipeUrl(request);
  }

  if (isRecipeSavePath(pathname)) {
    return routeRecipeSavePath(request, env, pathname);
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
