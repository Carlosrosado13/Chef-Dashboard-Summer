import { parseQuantity, parseYieldValue } from "./scaleRecipe.js";

const DEFAULT_PRICING_URL = "data/pricing/sample-pricing.json";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(name) {
  return normalizeText(name);
}

function normalizeUnit(unit) {
  return normalizeText(unit);
}

function createPricingMap(pricing) {
  const pricingMap = new Map();

  for (const item of pricing || []) {
    const normalizedName = normalizeName(item.ingredientName || item.name);

    if (!normalizedName) {
      continue;
    }

    pricingMap.set(normalizedName, {
      ingredientName: String(item.ingredientName || item.name || "").trim(),
      unitPrice: parseQuantity(item.unitPrice),
      purchaseUnit: String(item.purchaseUnit || "").trim(),
      normalizedUnit: normalizeUnit(item.purchaseUnit),
      supplier: String(item.supplier || "").trim(),
      lastUpdated: item.lastUpdated || ""
    });
  }

  return pricingMap;
}

function getResidentCount(ingredientSummary) {
  const targetYield = parseYieldValue(ingredientSummary?.filters?.targetYield);
  return targetYield || null;
}

function calculateIngredientCostLine(ingredient, priceRecord) {
  const amount = ingredient.amount;
  const hasPrice = Boolean(priceRecord);
  const unitMatches = hasPrice && normalizeUnit(ingredient.unit) === priceRecord.normalizedUnit;
  const canCalculate = hasPrice &&
    unitMatches &&
    Number.isFinite(amount) &&
    Number.isFinite(priceRecord.unitPrice);
  const totalCost = canCalculate ? amount * priceRecord.unitPrice : null;
  const issues = [];

  if (!hasPrice) {
    issues.push("Missing price record.");
  } else if (!unitMatches) {
    issues.push(`Price unit is ${priceRecord.purchaseUnit}, but demand uses ${ingredient.unit}.`);
  }

  if (!Number.isFinite(amount)) {
    issues.push("Ingredient quantity could not be costed safely.");
  }

  if (hasPrice && !Number.isFinite(priceRecord.unitPrice)) {
    issues.push("Unit price is invalid.");
  }

  return {
    ingredientName: ingredient.name,
    category: ingredient.purchaseCategory || "Miscellaneous",
    quantity: amount,
    unit: ingredient.unit,
    unitPrice: priceRecord?.unitPrice ?? null,
    purchaseUnit: priceRecord?.purchaseUnit || "",
    supplier: priceRecord?.supplier || "",
    lastUpdated: priceRecord?.lastUpdated || "",
    totalCost,
    issues,
    sources: ingredient.sources || []
  };
}

function addCost(map, key, title, amount) {
  const current = map.get(key) || {
    title,
    totalCost: 0,
    ingredientCount: 0
  };

  current.totalCost += amount;
  current.ingredientCount += 1;
  map.set(key, current);
}

function buildRecipeCosts(costLines) {
  const recipeMap = new Map();

  for (const line of costLines) {
    if (!Number.isFinite(line.totalCost) || line.sources.length === 0) {
      continue;
    }

    const apportionedCost = line.totalCost / line.sources.length;
    for (const source of line.sources) {
      addCost(recipeMap, source.recipe, source.recipe, apportionedCost);
    }
  }

  return Array.from(recipeMap.values()).sort((first, second) => second.totalCost - first.totalCost);
}

function buildCategoryBreakdown(costLines) {
  const categoryMap = new Map();

  for (const line of costLines) {
    if (!Number.isFinite(line.totalCost)) {
      continue;
    }

    addCost(categoryMap, line.category, line.category, line.totalCost);
  }

  return Array.from(categoryMap.values()).sort((first, second) => second.totalCost - first.totalCost);
}

function buildShortageCostImpact(costLines, inventoryNeeds) {
  const lineCostMap = new Map(costLines.map((line) => [normalizeName(line.ingredientName), line]));
  const shortageLines = (inventoryNeeds?.lines || []).filter((line) => {
    return ["shortage", "missing", "unit-mismatch"].includes(line.status);
  });

  return shortageLines.map((line) => {
    const costLine = lineCostMap.get(normalizeName(line.name));
    const unitPrice = costLine?.unitPrice ?? null;
    const quantity = line.status === "shortage" && Number.isFinite(line.shortageQuantity)
      ? line.shortageQuantity
      : line.requiredQuantity;
    const canCalculate = Number.isFinite(quantity) && Number.isFinite(unitPrice) && normalizeUnit(line.requiredUnit) === normalizeUnit(costLine?.purchaseUnit);

    return {
      ingredientName: line.name,
      status: line.status,
      quantity,
      unit: line.requiredUnit,
      estimatedCost: canCalculate ? quantity * unitPrice : null,
      issues: costLine?.issues || ["Missing price record."]
    };
  });
}

export async function loadPricing(url = DEFAULT_PRICING_URL) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        pricing: [],
        error: `Unable to load pricing: ${response.status} ${response.statusText}`
      };
    }

    const pricing = await response.json();

    return {
      ok: true,
      pricing: Array.isArray(pricing) ? pricing : [],
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      pricing: [],
      error: error.message || "Unable to load pricing."
    };
  }
}

export function calculateFoodCosts(ingredientSummary, inventoryNeeds, purchaseOrders, pricing) {
  const pricingMap = createPricingMap(pricing);
  const costLines = (ingredientSummary?.ingredients || []).map((ingredient) => {
    return calculateIngredientCostLine(ingredient, pricingMap.get(ingredient.normalizedName || normalizeName(ingredient.name)));
  });
  const totalMenuCost = costLines.reduce((total, line) => total + (Number.isFinite(line.totalCost) ? line.totalCost : 0), 0);
  const recipeCosts = buildRecipeCosts(costLines);
  const categoryBreakdown = buildCategoryBreakdown(costLines);
  const residentCount = getResidentCount(ingredientSummary);
  const shortageCostImpact = buildShortageCostImpact(costLines, inventoryNeeds);
  const estimatedShortageCost = shortageCostImpact.reduce((total, line) => {
    return total + (Number.isFinite(line.estimatedCost) ? line.estimatedCost : 0);
  }, 0);

  return {
    filters: ingredientSummary?.filters || {},
    generatedAt: new Date().toISOString(),
    recipeCosts,
    ingredientCosts: costLines.sort((first, second) => (second.totalCost || 0) - (first.totalCost || 0)),
    categoryBreakdown,
    shortageCostImpact,
    totalMenuCost,
    mealCost: totalMenuCost,
    weekCost: totalMenuCost,
    residentCount,
    costPerResident: residentCount ? totalMenuCost / residentCount : null,
    estimatedTotalPurchaseCost: purchaseOrders?.estimatedGrandTotal ?? estimatedShortageCost,
    estimatedShortageCost,
    missingPrices: costLines.filter((line) => line.issues.some((issue) => issue === "Missing price record.")),
    unitIssues: costLines.filter((line) => line.issues.some((issue) => issue.includes("Price unit"))),
    pricedIngredientCount: costLines.filter((line) => Number.isFinite(line.totalCost)).length,
    totalIngredientCount: costLines.length
  };
}

export { DEFAULT_PRICING_URL };
