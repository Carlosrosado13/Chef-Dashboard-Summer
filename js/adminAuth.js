const SESSION_KEY = "chefDashboard.adminSession";
const LOCAL_WORKER_ORIGIN = "http://127.0.0.1:8787";
const ADMIN_LOGIN_PATH = "/api/admin/login";
const ADMIN_LOGOUT_PATH = "/api/admin/logout";
const ADMIN_SESSION_PATH = "/api/admin/session";

function getApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isLocalStaticHost = ["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "8787";
  const isLocalFile = window.location.protocol === "file:";

  return isLocalStaticHost || isLocalFile ? `${LOCAL_WORKER_ORIGIN}${normalizedPath}` : normalizedPath;
}

function logAuthRequest(method, path) {
  const url = getApiUrl(path);
  console.log(`[admin-auth-ui] ${method} ${url}`);
  return url;
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text.trim()) {
    return {
      ok: false,
      error: `Empty response from admin API (${response.status}).`
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: `Admin API returned invalid JSON (${response.status}).`
    };
  }
}

function getStoredSession() {
  const rawSession = sessionStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession);

    if (!session.token || !session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

function storeAdminSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getAdminAuthHeader() {
  const session = getStoredSession();

  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export async function adminFetch(url, options = {}) {
  const response = await fetch(getApiUrl(url), {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
      ...getAdminAuthHeader()
    }
  });

  if (response.status === 401) {
    clearAdminSession();
  }

  return response;
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

function renderLoginForm(container, options = {}) {
  const form = createElement("form", "admin-login");
  const title = createElement("h2", "", "Admin Login");
  const field = createElement("label", "admin-field");
  const label = createElement("span", "", "Temporary admin password");
  const input = createElement("input", "");
  const submit = createElement("button", "filter-button", "Log in");
  const message = createElement("p", "admin-muted", "");

  input.type = "password";
  input.name = "password";
  input.autocomplete = "current-password";
  submit.type = "submit";
  field.append(label, input);
  form.append(title, field, submit, message);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Checking password...";

    try {
      const response = await fetch(logAuthRequest("POST", ADMIN_LOGIN_PATH), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({ password: input.value })
      });
      console.log(`[admin-auth-ui] response ${response.status} ${response.statusText || ""}`.trim());
      const result = await readJsonResponse(response);

      if (!response.ok || !result.ok) {
        message.textContent = result.error || "Login failed.";
        message.className = "admin-auth-error";
        return;
      }

      storeAdminSession({
        token: result.token,
        expiresAt: result.expiresAt
      });
      options.onAuthenticated?.(result);
    } catch (error) {
      message.textContent = error.message || "Authentication service unavailable.";
      message.className = "admin-auth-error";
    }
  });

  container.replaceChildren(form);
}

async function verifySession() {
  const session = getStoredSession();

  if (!session) {
    return {
      ok: false
    };
  }

  try {
    const response = await adminFetch(ADMIN_SESSION_PATH);
    const result = await readJsonResponse(response);

    return response.ok && result.ok ? result : { ok: false };
  } catch {
    return {
      ok: false
    };
  }
}

export async function initializeAdminAuth(options = {}) {
  const authRoot = document.querySelector("#admin-auth-root");
  const contentRoot = document.querySelector("#admin-content");
  const statusRoot = document.querySelector("#auth-status");
  const logoutButton = document.querySelector("#admin-logout");

  function showAuthenticated(session) {
    authRoot.hidden = true;
    contentRoot.hidden = false;
    logoutButton.hidden = false;
    statusRoot.textContent = `Authenticated until ${new Date(session.expiresAt).toLocaleString()}`;
    statusRoot.dataset.tone = "success";
    options.onAuthenticated?.();
  }

  function showLogin() {
    authRoot.hidden = false;
    contentRoot.hidden = true;
    logoutButton.hidden = true;
    statusRoot.textContent = "Not authenticated";
    statusRoot.dataset.tone = "error";
    renderLoginForm(authRoot, {
      onAuthenticated: showAuthenticated
    });
  }

  logoutButton.addEventListener("click", async () => {
    await adminFetch(ADMIN_LOGOUT_PATH, { method: "POST" }).catch(() => {});
    clearAdminSession();
    showLogin();
  });

  const session = await verifySession();

  if (session.ok) {
    showAuthenticated(session);
    return;
  }

  showLogin();
}
