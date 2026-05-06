const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const adminSessions = new Map();

function createTimestamp() {
  return new Date().toISOString();
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function createSession() {
  const token = crypto.randomUUID();
  const createdAt = Date.now();
  const expiresAt = createdAt + SESSION_TTL_MS;

  adminSessions.set(token, {
    token,
    createdAt,
    expiresAt
  });

  return {
    token,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  return match ? match[1] : "";
}

function cleanupExpiredSessions() {
  const now = Date.now();

  for (const [token, session] of adminSessions.entries()) {
    if (session.expiresAt <= now) {
      adminSessions.delete(token);
    }
  }
}

export function requireAdminAuth(request) {
  cleanupExpiredSessions();

  const token = getBearerToken(request);
  const session = adminSessions.get(token);

  if (!session) {
    return {
      ok: false,
      response: jsonResponse({
        ok: false,
        error: "Unauthorized admin request.",
        code: "UNAUTHORIZED",
        timestamp: createTimestamp()
      }, 401)
    };
  }

  if (session.expiresAt <= Date.now()) {
    adminSessions.delete(token);
    return {
      ok: false,
      response: jsonResponse({
        ok: false,
        error: "Admin session expired.",
        code: "SESSION_EXPIRED",
        timestamp: createTimestamp()
      }, 401)
    };
  }

  return {
    ok: true,
    session
  };
}

export async function handleAdminLogin(request, env) {
  console.log(`[admin-auth] ${request.method} /api/admin/login ${createTimestamp()}`);

  if (!env?.ADMIN_SECRET) {
    console.warn("[admin-auth] ADMIN_SECRET is missing. Add it to .dev.vars for Wrangler local development.");

    return jsonResponse({
      ok: false,
      error: "Admin authentication is not configured.",
      timestamp: createTimestamp()
    }, 500);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({
      ok: false,
      error: "Request JSON could not be parsed.",
      timestamp: createTimestamp()
    }, 400);
  }

  if (body?.password !== env.ADMIN_SECRET) {
    return jsonResponse({
      ok: false,
      error: "Invalid admin password.",
      code: "INVALID_PASSWORD",
      timestamp: createTimestamp()
    }, 401);
  }

  const session = createSession();

  return jsonResponse({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    timestamp: createTimestamp()
  });
}

export async function handleAdminLogout(request) {
  console.log(`[admin-auth] ${request.method} /api/admin/logout ${createTimestamp()}`);

  const token = getBearerToken(request);

  if (token) {
    adminSessions.delete(token);
  }

  return jsonResponse({
    ok: true,
    message: "Admin session closed.",
    timestamp: createTimestamp()
  });
}

export function handleAdminSession(request) {
  console.log(`[admin-auth] ${request.method} /api/admin/session ${createTimestamp()}`);

  const auth = requireAdminAuth(request);

  if (!auth.ok) {
    return auth.response;
  }

  return jsonResponse({
    ok: true,
    expiresAt: new Date(auth.session.expiresAt).toISOString(),
    timestamp: createTimestamp()
  });
}

export { adminSessions };
