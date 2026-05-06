const DEFAULT_FORECAST_OPTIONS = {
  horizonWeeks: 4,
  weeklyGrowthRate: 0.03
};

function asNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function round(value) {
  return Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : null;
}

function normalizeUnit(unit) {
  return String(unit || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateLinearTrend(points = []) {
  const numericPoints = points
    .map((point, index) => ({
      x: index,
      y: Number(point.value)
    }))
    .filter((point) => Number.isFinite(point.y));

  if (numericPoints.length < 2) {
    return {
      slope: 0,
      direction: "flat",
      confidence: numericPoints.length === 1 ? "low" : "none"
    };
  }

  const count = numericPoints.length;
  const sumX = numericPoints.reduce((total, point) => total + point.x, 0);
  const sumY = numericPoints.reduce((total, point) => total + point.y, 0);
  const sumXY = numericPoints.reduce((total, point) => total + point.x * point.y, 0);
  const sumXX = numericPoints.reduce((total, point) => total + point.x * point.x, 0);
  const denominator = count * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (count * sumXY - sumX * sumY) / denominator;

  return {
    slope,
    direction: slope > 0 ? "up" : slope < 0 ? "down" : "flat",
    confidence: "moderate"
  };
}

export function simulateFutureWeeks(baseValue, options = {}) {
  const forecastOptions = {
    ...DEFAULT_FORECAST_OPTIONS,
    ...options
  };
  const weeks = [];

  for (let index = 1; index <= forecastOptions.horizonWeeks; index += 1) {
    weeks.push({
      weekOffset: index,
      label: `Week +${index}`,
      value: round(asNumber(baseValue) * ((1 + forecastOptions.weeklyGrowthRate) ** index))
    });
  }

  return weeks;
}

function projectIngredientUsage(ingredientSummary, options) {
  return (ingredientSummary?.ingredients || []).map((ingredient) => {
    const weeklyQuantity = ingredient.amount;
    const projectedWeeks = simulateFutureWeeks(weeklyQuantity, options);

    return {
      ingredientName: ingredient.name,
      category: ingredient.purchaseCategory || "Miscellaneous",
      unit: ingredient.unit,
      weeklyQuantity,
      projectedQuantity: round(projectedWeeks.reduce((total, week) => total + asNumber(week.value), 0)),
      projectedWeeks,
      useCount: ingredient.sources?.length || 0
    };
  }).sort((first, second) => asNumber(second.projectedQuantity) - asNumber(first.projectedQuantity));
}

function projectSupplierSpending(purchaseOrders, options) {
  return (purchaseOrders?.supplierOrders || []).map((order) => {
    const projectedWeeks = simulateFutureWeeks(order.estimatedTotal, options);

    return {
      supplierName: order.supplierName,
      weeklySpend: round(order.estimatedTotal),
      projectedSpend: round(projectedWeeks.reduce((total, week) => total + asNumber(week.value), 0)),
      projectedWeeks,
      reviewCount: order.reviewCount,
      itemCount: order.itemCount
    };
  }).sort((first, second) => asNumber(second.projectedSpend) - asNumber(first.projectedSpend));
}

function projectCategorySpending(foodCosts, analytics, options) {
  const categories = foodCosts?.categoryBreakdown?.length ? foodCosts.categoryBreakdown : analytics?.categoryUsage || [];

  return categories.map((category) => {
    const title = category.title || category.category;
    const totalCost = category.totalCost || 0;
    const projectedWeeks = simulateFutureWeeks(totalCost, options);

    return {
      category: title,
      weeklySpend: round(totalCost),
      projectedSpend: round(projectedWeeks.reduce((total, week) => total + asNumber(week.value), 0)),
      projectedWeeks
    };
  }).sort((first, second) => asNumber(second.projectedSpend) - asNumber(first.projectedSpend));
}

function projectInventoryDepletion(inventoryNeeds, options) {
  return (inventoryNeeds?.lines || []).map((line) => {
    const canCompare = Number.isFinite(line.currentQuantity) &&
      Number.isFinite(line.requiredQuantity) &&
      normalizeUnit(line.requiredUnit) === normalizeUnit(line.inventoryUnit) &&
      line.requiredQuantity > 0;
    const weeksUntilDepleted = canCompare ? Math.floor(line.currentQuantity / line.requiredQuantity) : null;
    const projectedRemaining = canCompare
      ? round(line.currentQuantity - line.requiredQuantity * options.horizonWeeks)
      : null;
    const alertLevel = line.status === "missing" || line.status === "unit-mismatch"
      ? "review"
      : canCompare && weeksUntilDepleted <= options.horizonWeeks
        ? "shortage"
        : line.status === "low"
          ? "low"
          : "ok";

    return {
      ingredientName: line.name,
      category: line.category,
      currentQuantity: line.currentQuantity,
      weeklyRequired: line.requiredQuantity,
      unit: line.requiredUnit,
      weeksUntilDepleted,
      projectedRemaining,
      alertLevel,
      sourceStatus: line.status
    };
  }).sort((first, second) => {
    const firstWeeks = first.weeksUntilDepleted ?? Number.MAX_SAFE_INTEGER;
    const secondWeeks = second.weeksUntilDepleted ?? Number.MAX_SAFE_INTEGER;
    return firstWeeks - secondWeeks || first.ingredientName.localeCompare(second.ingredientName);
  });
}

function projectWeeklyMenuCosts(foodCosts, options) {
  return simulateFutureWeeks(foodCosts?.weekCost || 0, options).map((week) => ({
    ...week,
    cost: week.value
  }));
}

function buildFutureOrderingNeeds(projectedIngredientUsage, inventoryDepletion, options) {
  const inventoryMap = new Map(inventoryDepletion.map((line) => [line.ingredientName.toLowerCase(), line]));

  return projectedIngredientUsage.map((usage) => {
    const inventoryLine = inventoryMap.get(usage.ingredientName.toLowerCase());
    const projectedNeed = usage.projectedQuantity;
    const canCompare = inventoryLine &&
      Number.isFinite(inventoryLine.currentQuantity) &&
      normalizeUnit(inventoryLine.unit) === normalizeUnit(usage.unit);
    const orderQuantity = canCompare
      ? Math.max(projectedNeed - inventoryLine.currentQuantity, 0)
      : projectedNeed;

    return {
      ingredientName: usage.ingredientName,
      category: usage.category,
      orderQuantity: round(orderQuantity),
      unit: usage.unit,
      reason: canCompare
        ? `Projected ${options.horizonWeeks}-week demand minus current inventory.`
        : "Inventory data missing or unit review needed."
    };
  }).filter((item) => asNumber(item.orderQuantity) > 0);
}

export function calculateForecasts({
  ingredientSummary,
  inventoryNeeds,
  purchaseOrders,
  foodCosts,
  analytics,
  options = {}
} = {}) {
  const forecastOptions = {
    ...DEFAULT_FORECAST_OPTIONS,
    ...options
  };
  const projectedIngredientUsage = projectIngredientUsage(ingredientSummary, forecastOptions);
  const projectedSupplierSpending = projectSupplierSpending(purchaseOrders, forecastOptions);
  const projectedCategorySpending = projectCategorySpending(foodCosts, analytics, forecastOptions);
  const projectedInventoryDepletion = projectInventoryDepletion(inventoryNeeds, forecastOptions);
  const projectedWeeklyMenuCosts = projectWeeklyMenuCosts(foodCosts, forecastOptions);
  const futureOrderingNeeds = buildFutureOrderingNeeds(projectedIngredientUsage, projectedInventoryDepletion, forecastOptions);
  const upcomingShortageAlerts = projectedInventoryDepletion.filter((line) => ["shortage", "low", "review"].includes(line.alertLevel));
  const weeklyCostTrend = calculateLinearTrend([
    ...(analytics?.chartData?.weeklyFoodCost || []),
    ...projectedWeeklyMenuCosts.map((week) => ({
      label: week.label,
      value: week.cost
    }))
  ]);

  return {
    filters: ingredientSummary?.filters || {},
    generatedAt: new Date().toISOString(),
    options: forecastOptions,
    summaryCards: [
      {
        label: "Forecast Window",
        value: forecastOptions.horizonWeeks,
        suffix: "weeks",
        format: "number"
      },
      {
        label: "Projected Menu Cost",
        value: projectedWeeklyMenuCosts.reduce((total, week) => total + asNumber(week.cost), 0),
        format: "currency"
      },
      {
        label: "Projected Supplier Spend",
        value: projectedSupplierSpending.reduce((total, supplier) => total + asNumber(supplier.projectedSpend), 0),
        format: "currency"
      },
      {
        label: "Upcoming Alerts",
        value: upcomingShortageAlerts.length,
        format: "number"
      }
    ],
    projectedIngredientUsage,
    projectedSupplierSpending,
    projectedInventoryDepletion,
    projectedCategorySpending,
    projectedWeeklyMenuCosts,
    upcomingShortageAlerts,
    futureOrderingNeeds,
    chartData: {
      weeklyMenuCosts: projectedWeeklyMenuCosts.map((week) => ({
        label: week.label,
        value: week.cost
      })),
      supplierSpending: projectedSupplierSpending.map((supplier) => ({
        label: supplier.supplierName,
        value: supplier.projectedSpend
      })),
      categorySpending: projectedCategorySpending.map((category) => ({
        label: category.category,
        value: category.projectedSpend
      })),
      ingredientUsage: projectedIngredientUsage.slice(0, 12).map((ingredient) => ({
        label: ingredient.ingredientName,
        value: ingredient.projectedQuantity,
        metadata: {
          unit: ingredient.unit,
          category: ingredient.category
        }
      }))
    },
    trendSummary: {
      weeklyCostTrend,
      support: "Use simulateFutureWeeks and calculateLinearTrend with persisted historical points for richer future comparisons."
    },
    dataQuality: {
      missingRecipes: ingredientSummary?.missingRecipes?.length || 0,
      missingPricing: foodCosts?.missingPrices?.length || 0,
      pricingUnitIssues: foodCosts?.unitIssues?.length || 0,
      inventoryReviews: (inventoryNeeds?.missingCount || 0) + (inventoryNeeds?.unitIssues?.length || 0),
      supplierReviews: purchaseOrders?.reviewCount || 0
    }
  };
}

export { DEFAULT_FORECAST_OPTIONS };
