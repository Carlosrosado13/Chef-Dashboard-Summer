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

function formatCurrency(amount) {
  if (!Number.isFinite(amount)) {
    return "Review";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

function renderMetric(label, value) {
  const metric = createElement("div", "food-cost-metric");
  metric.append(
    createElement("span", "food-cost-metric__label", label),
    createElement("strong", "food-cost-metric__value", value)
  );
  return metric;
}

function renderRankedList(title, items, getLabel, getValue) {
  const section = createElement("section", "food-cost-card");
  const heading = createElement("h3", "", title);
  const list = createElement("ol", "food-cost-list");

  for (const item of items.slice(0, 6)) {
    const row = createElement("li", "food-cost-list__item");
    row.append(
      createElement("span", "", getLabel(item)),
      createElement("strong", "", getValue(item))
    );
    list.append(row);
  }

  section.append(heading, list.children.length ? list : createElement("p", "ingredient-empty", "No costed items available yet."));
  return section;
}

function renderCategoryBreakdown(categories) {
  return renderRankedList(
    "Category Cost Breakdown",
    categories,
    (category) => category.title,
    (category) => formatCurrency(category.totalCost)
  );
}

function renderShortageImpact(shortages) {
  return renderRankedList(
    "Shortage Cost Impact",
    shortages.filter((line) => Number.isFinite(line.estimatedCost)).sort((first, second) => second.estimatedCost - first.estimatedCost),
    (line) => `${line.ingredientName} (${line.status})`,
    (line) => formatCurrency(line.estimatedCost)
  );
}

function renderCostWarnings(summary) {
  if (summary.missingPrices.length === 0 && summary.unitIssues.length === 0) {
    return null;
  }

  const section = createElement("section", "ingredient-warning");
  section.append(createElement("h3", "", "Pricing review needed"));
  const list = createElement("ul", "");

  for (const line of summary.missingPrices) {
    list.append(createElement("li", "", `${line.ingredientName}: missing price record`));
  }

  for (const line of summary.unitIssues) {
    list.append(createElement("li", "", `${line.ingredientName}: ${line.issues.join(" ")}`));
  }

  section.append(list);
  return section;
}

export function renderFoodCosts(summary) {
  const panel = createElement("section", "food-cost-panel");
  const header = createElement("header", "food-cost-panel__header");
  const title = createElement("h2", "", "Food Costing");
  const meta = createElement(
    "p",
    "",
    `${summary.pricedIngredientCount} of ${summary.totalIngredientCount} ingredients priced`
  );
  const metrics = createElement("div", "food-cost-metrics");
  const grids = createElement("div", "food-cost-grid");

  header.append(title, meta);
  metrics.append(
    renderMetric("Menu Cost", formatCurrency(summary.totalMenuCost)),
    renderMetric("Week Cost", formatCurrency(summary.weekCost)),
    renderMetric("Meal Cost", formatCurrency(summary.mealCost)),
    renderMetric("Cost Per Resident", formatCurrency(summary.costPerResident)),
    renderMetric("Purchase Estimate", formatCurrency(summary.estimatedTotalPurchaseCost)),
    renderMetric("Shortage Impact", formatCurrency(summary.estimatedShortageCost))
  );

  grids.append(
    renderRankedList(
      "Highest Cost Ingredients",
      summary.ingredientCosts.filter((line) => Number.isFinite(line.totalCost)),
      (line) => line.ingredientName,
      (line) => formatCurrency(line.totalCost)
    ),
    renderRankedList(
      "Highest Cost Recipes",
      summary.recipeCosts,
      (recipe) => recipe.title,
      (recipe) => formatCurrency(recipe.totalCost)
    ),
    renderCategoryBreakdown(summary.categoryBreakdown),
    renderShortageImpact(summary.shortageCostImpact)
  );

  panel.append(header, metrics, grids);

  const warnings = renderCostWarnings(summary);
  if (warnings) {
    panel.append(warnings);
  }

  return panel;
}

export function renderFoodCostsInto(container, summary) {
  if (!container) {
    throw new Error("A food cost container is required.");
  }

  container.replaceChildren(renderFoodCosts(summary));
}
