const LOCAL_API_BASE = "http://127.0.0.1:8787";
const PRODUCTION_API_BASE = "https://YOUR-WORKER.workers.dev";

function trimTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getConfiguredApiBase() {
  const globalApiBase = window.CHEF_DASHBOARD_API_BASE || window.CHEF_DASHBOARD_API_ORIGIN;
  const metaApiBase = document.querySelector("meta[name='chef-dashboard-api-base']")?.content
    || document.querySelector("meta[name='chef-dashboard-api-origin']")?.content;

  return trimTrailingSlash(globalApiBase || metaApiBase);
}

function isLocalFrontend() {
  return window.location.protocol === "file:"
    || ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export const API_BASE = getConfiguredApiBase() || (isLocalFrontend() ? LOCAL_API_BASE : PRODUCTION_API_BASE);

console.log("API BASE:", API_BASE);

export function getApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
