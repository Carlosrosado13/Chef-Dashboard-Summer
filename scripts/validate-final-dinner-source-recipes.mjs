import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractRecipeFromHtmlDocument } from "../worker/src/extractRecipe.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (file) => JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, ""));
const snapshot = await readJson(path.join(root, ".tmp-final-dinner-deployment-snapshot.json"));
const recipes = await readJson(path.join(root, "data", "recipes", "sample-recipes.json"));

function normalizeTitle(value) {
  return String(value || "")
    .replace(/\s*\((?:\s*(?:gf|df|v|vg|nf|sf|vegan|vegetarian|gluten free|dairy free)\s*(?:\/|,|\+|&|\band\b|\s)*)+\)\s*$/gi, "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function identifiers(value) {
  const values = typeof value === "string"
    ? [value]
    : [value?.id, value?.recipeId, value?.slug, value?.title, value?.name];
  const result = new Set();
  for (const entry of values) {
    const text = String(entry || "").trim();
    const normalized = normalizeTitle(text);
    if (text) result.add(text);
    if (normalized) result.add(normalized);
    if (normalized) result.add(normalized.replace(/ /g, "-"));
  }
  return result;
}

function findRecipeIndex(reference) {
  const referenceIds = identifiers(reference);
  return recipes.findIndex((recipe) => {
    const recipeIds = identifiers(recipe);
    return [...referenceIds].some((id) => recipeIds.has(id));
  });
}

function getSourceUrl(recipe) {
  return recipe?.metadata?.sourceUrl
    || recipe?.metadata?.importedFromUrl
    || recipe?.metadata?.recipeUrl
    || recipe?.sourceUrl
    || recipe?.importedFromUrl
    || recipe?.recipeUrl
    || "";
}

function completeness(recipe) {
  const ingredients = Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe?.steps) ? recipe.steps : [];
  const issues = [];
  if (ingredients.length < 3) issues.push("fewer than 3 ingredients");
  if (ingredients.some((item) =>
    !String(item?.name || "").trim()
    || !Number.isFinite(Number(item?.amount))
    || Number(item.amount) <= 0
    || !String(item?.unit || "").trim()
  )) issues.push("ingredient quantities or units missing");
  if (steps.length < 3) issues.push("fewer than 3 steps");
  if (steps.some((step) => !String(step || "").trim())) issues.push("blank instruction step");
  return issues;
}

const candidates = new Map();
for (const row of snapshot.finalRows) {
  const index = findRecipeIndex(row.MenuItem);
  if (index < 0) continue;
  const sourceUrl = getSourceUrl(recipes[index]);
  if (!sourceUrl || candidates.has(index)) continue;
  candidates.set(index, {
    recipeIndex: index,
    menuItem: row.MenuItem,
    currentTitle: recipes[index].title,
    sourceUrl
  });
}

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9"
};

async function validate(candidate) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(candidate.sourceUrl, {
      headers,
      redirect: "follow",
      signal: controller.signal
    });
    if (!response.ok) {
      return { ...candidate, ok: false, status: response.status, error: `${response.status} ${response.statusText}` };
    }
    const html = await response.text();
    const extracted = extractRecipeFromHtmlDocument(html, candidate.sourceUrl);
    const issues = completeness(extracted);
    return {
      ...candidate,
      ok: issues.length === 0,
      status: response.status,
      finalUrl: response.url,
      issues,
      extracted
    };
  } catch (error) {
    return {
      ...candidate,
      ok: false,
      status: null,
      error: error?.name === "AbortError" ? "Request timed out" : String(error?.message || error)
    };
  } finally {
    clearTimeout(timer);
  }
}

const queue = [...candidates.values()];
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < queue.length) {
    const item = queue[cursor++];
    results.push(await validate(item));
  }
}
await Promise.all(Array.from({ length: Math.min(5, queue.length) }, worker));
results.sort((a, b) => a.recipeIndex - b.recipeIndex);

const output = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  validated: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok).length,
  results
};
await fs.writeFile(
  path.join(root, ".tmp-final-dinner-source-validation.json"),
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8"
);
console.log(JSON.stringify({
  total: output.total,
  validated: output.validated,
  failed: output.failed,
  failures: results.filter((item) => !item.ok).map((item) => ({
    menuItem: item.menuItem,
    sourceUrl: item.sourceUrl,
    error: item.error || item.issues?.join("; ")
  }))
}, null, 2));
