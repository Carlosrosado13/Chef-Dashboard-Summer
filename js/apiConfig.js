export const API_BASE = "https://chef-dashboard-api.carlosrosado13.workers.dev";

console.log("API BASE:", API_BASE);

export function getApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${API_BASE}${normalizedPath}`;
}