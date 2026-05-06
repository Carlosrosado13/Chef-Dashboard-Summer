function asCurrencyValue(value) {
  return Number.isFinite(value) ? value : 0;
}

function countIngredientUses(ingredients) {
  return (ingredients || [])
    .map((ingredient) => ({
      ingredientName: ingredient.name,
      category: ingredient.purchaseCategory || "Miscellaneous",
      useCount: ingredient.sources?.length || 0,
      quantity: ingredient.amount,
      unit: ingredient.unit
    }))
    .sort((first, second) => second.useCount - first.useCount || first.ingredientName.localeCompare(second.ingredientName));
}

function buildCategoryUsage(ingredientSummary, foodCosts) {
  const costMap = new Map((foodCosts?.categoryBreakdown || []).map((category) => [category.title, category.totalCost]));

  return (ingredientSummary?.categorizedIngredients || []).map((group) => ({
    category: group.category,
    ingredientCount: group.count,
    useCount: group.ingredients.reduce((total, ingredient) => total + (ingredient.sources?.length || 0), 0),
    totalCost: costMap.get(group.category) || 0
  }));
}

function buildSupplierSpend(purchaseOrders) {
  return (purchaseOrders?.supplierOrders || []).map((order) => ({
    supplierName: order.supplierName,
    estimatedSpend: asCurrencyValue(order.estimatedTotal),
    itemCount: order.itemCount,
    shortageCount: order.shortageCount,
    reviewCount: order.reviewCount
  })).sort((first, second) => second.estimatedSpend - first.estimatedSpend);
}

function createTrendPoint(label, value, metadata = {}) {
  return {
    label,
    value: asCurrencyValue(value),
    metadata
  };
}

export function calculateAnalytics({
  ingredientSummary,
  inventoryNeeds,
  purchaseOrders,
  foodCosts,
  trendHistory = []
} = {}) {
  const totalWeeklyFoodCost = asCurrencyValue(foodCosts?.weekCost);
  const costPerResident = Number.isFinite(foodCosts?.costPerResident) ? foodCosts.costPerResident : null;
  const supplierSpending = buildSupplierSpend(purchaseOrders);
  const categoryUsage = buildCategoryUsage(ingredientSummary, foodCosts);
  const highestCostRecipes = (foodCosts?.recipeCosts || []).slice(0, 8);
  const highestCostIngredients = (foodCosts?.ingredientCosts || [])
    .filter((line) => Number.isFinite(line.totalCost))
    .slice(0, 8);
  const mostUsedIngredients = countIngredientUses(ingredientSummary?.ingredients).slice(0, 8);
  const pricingIssueCount = (foodCosts?.missingPrices?.length || 0) + (foodCosts?.unitIssues?.length || 0);
  const inventoryReviewCount = (inventoryNeeds?.missingCount || 0) + (inventoryNeeds?.unitIssues?.length || 0);

  return {
    filters: ingredientSummary?.filters || {},
    generatedAt: new Date().toISOString(),
    summaryCards: [
      {
        label: "Weekly Food Cost",
        value: totalWeeklyFoodCost,
        format: "currency"
      },
      {
        label: "Cost Per Resident",
        value: costPerResident,
        format: "currency"
      },
      {
        label: "Inventory Shortages",
        value: inventoryNeeds?.shortageCount || 0,
        format: "number"
      },
      {
        label: "Supplier Spend",
        value: purchaseOrders?.estimatedGrandTotal || 0,
        format: "currency"
      },
      {
        label: "Pricing Reviews",
        value: pricingIssueCount,
        format: "number"
      },
      {
        label: "Inventory Reviews",
        value: inventoryReviewCount,
        format: "number"
      }
    ],
    highestCostRecipes,
    highestCostIngredients,
    mostUsedIngredients,
    inventoryShortageCounts: {
      shortages: inventoryNeeds?.shortageCount || 0,
      lowStock: inventoryNeeds?.lowStockCount || 0,
      missingInventory: inventoryNeeds?.missingCount || 0,
      unitIssues: inventoryNeeds?.unitIssues?.length || 0
    },
    categoryUsage,
    supplierSpending,
    chartData: {
      weeklyFoodCost: [
        ...trendHistory,
        createTrendPoint(foodCosts?.filters?.week || "Current Week", totalWeeklyFoodCost, foodCosts?.filters || {})
      ],
      categoryCost: categoryUsage.map((category) => ({
        label: category.category,
        value: category.totalCost,
        metadata: {
          ingredientCount: category.ingredientCount,
          useCount: category.useCount
        }
      })),
      supplierSpend: supplierSpending.map((supplier) => ({
        label: supplier.supplierName,
        value: supplier.estimatedSpend,
        metadata: {
          itemCount: supplier.itemCount,
          reviewCount: supplier.reviewCount
        }
      })),
      ingredientUsage: mostUsedIngredients.map((ingredient) => ({
        label: ingredient.ingredientName,
        value: ingredient.useCount,
        metadata: {
          category: ingredient.category,
          quantity: ingredient.quantity,
          unit: ingredient.unit
        }
      }))
    },
    trendSupport: {
      enabled: true,
      keyFields: ["filters.mealType", "filters.week", "generatedAt"],
      note: "Pass prior analytics points as trendHistory to compare future weeks."
    },
    dataQuality: {
      missingRecipes: ingredientSummary?.missingRecipes?.length || 0,
      missingPricing: foodCosts?.missingPrices?.length || 0,
      pricingUnitIssues: foodCosts?.unitIssues?.length || 0,
      incompleteInventory: inventoryNeeds?.missingCount || 0,
      inventoryUnitIssues: inventoryNeeds?.unitIssues?.length || 0,
      supplierReviews: purchaseOrders?.reviewCount || 0
    }
  };
}
