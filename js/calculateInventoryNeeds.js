import { INGREDIENT_CATEGORIES } from "./ingredientCategories.js";
import { parseQuantity } from "./scaleRecipe.js";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUnit(unit) {
  return normalizeText(unit);
}

function normalizeName(name) {
  return normalizeText(name);
}

function formatInventoryCategory(category) {
  return INGREDIENT_CATEGORIES.includes(category) ? category : "Miscellaneous";
}

function createInventoryMap(inventory) {
  const inventoryMap = new Map();

  for (const item of inventory || []) {
    const normalizedName = normalizeName(item.ingredientName || item.name);
    const normalizedUnit = normalizeUnit(item.unit);

    if (!normalizedName) {
      continue;
    }

    inventoryMap.set(normalizedName, {
      ingredientName: String(item.ingredientName || item.name || "").trim(),
      currentQuantity: parseQuantity(item.currentQuantity),
      rawCurrentQuantity: item.currentQuantity,
      unit: String(item.unit || "").trim(),
      normalizedUnit,
      category: formatInventoryCategory(item.category),
      reorderThreshold: parseQuantity(item.reorderThreshold),
      rawReorderThreshold: item.reorderThreshold
    });
  }

  return inventoryMap;
}

function calculateLine(ingredient, inventoryItem) {
  const requiredQuantity = ingredient.amount;
  const currentQuantity = inventoryItem?.currentQuantity ?? null;
  const reorderThreshold = inventoryItem?.reorderThreshold ?? null;
  const inventoryUnit = inventoryItem?.unit || "";
  const unitMatches = !inventoryItem || normalizeUnit(ingredient.unit) === inventoryItem.normalizedUnit;
  const canCompare = Boolean(inventoryItem) &&
    unitMatches &&
    Number.isFinite(requiredQuantity) &&
    Number.isFinite(currentQuantity);
  const remainingQuantity = canCompare ? currentQuantity - requiredQuantity : null;
  const shortageQuantity = canCompare ? Math.max(requiredQuantity - currentQuantity, 0) : null;
  const isShortage = canCompare && shortageQuantity > 0;
  const isLowStock = canCompare &&
    Number.isFinite(reorderThreshold) &&
    remainingQuantity <= reorderThreshold &&
    !isShortage;

  return {
    name: ingredient.name,
    normalizedName: ingredient.normalizedName || normalizeName(ingredient.name),
    category: formatInventoryCategory(ingredient.purchaseCategory || inventoryItem?.category),
    requiredQuantity,
    requiredUnit: ingredient.unit,
    currentQuantity,
    inventoryUnit,
    reorderThreshold,
    remainingQuantity,
    shortageQuantity,
    status: !inventoryItem
      ? "missing"
      : !unitMatches
        ? "unit-mismatch"
        : isShortage
          ? "shortage"
          : isLowStock
            ? "low"
            : "ok",
    sources: ingredient.sources || []
  };
}

export function calculateInventoryNeeds(ingredientSummary, inventory) {
  const inventoryMap = createInventoryMap(inventory);
  const lines = [];
  const missingInventory = [];
  const unitIssues = [];

  for (const ingredient of ingredientSummary?.ingredients || []) {
    const inventoryItem = inventoryMap.get(ingredient.normalizedName || normalizeName(ingredient.name));
    const line = calculateLine(ingredient, inventoryItem);

    if (line.status === "missing") {
      missingInventory.push(line);
    }

    if (line.status === "unit-mismatch") {
      unitIssues.push(line);
    }

    lines.push(line);
  }

  const grouped = INGREDIENT_CATEGORIES.map((category) => {
    const categoryLines = lines.filter((line) => line.category === category);
    return {
      category,
      count: categoryLines.length,
      shortages: categoryLines.filter((line) => line.status === "shortage").length,
      lowStock: categoryLines.filter((line) => line.status === "low").length,
      missing: categoryLines.filter((line) => line.status === "missing").length,
      items: categoryLines
    };
  }).filter((group) => group.count > 0);

  return {
    filters: ingredientSummary?.filters || {},
    grouped,
    lines,
    missingInventory,
    unitIssues,
    shortageCount: lines.filter((line) => line.status === "shortage").length,
    lowStockCount: lines.filter((line) => line.status === "low").length,
    missingCount: missingInventory.length
  };
}
