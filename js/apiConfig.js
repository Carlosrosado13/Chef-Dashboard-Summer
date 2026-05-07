export const API_BASE = "http://127.0.0.1:8787";

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