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

function formatValue(value, format) {
  if (format === "currency") {
    if (!Number.isFinite(value)) {
      return "Review";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  return Number.isFinite(value) ? String(value) : "0";
}

function renderSummaryCard(card) {
  const item = createElement("div", "analytics-card");
  item.append(
    createElement("span", "analytics-card__label", card.label),
    createElement("strong", "analytics-card__value", formatValue(card.value, card.format))
  );
  return item;
}

function renderRankedList(title, items, getLabel, getValue) {
  const section = createElement("section", "analytics-section");
  const heading = createElement("h3", "", title);
  const list = createElement("ol", "analytics-list");

  for (const item of items) {
    const row = createElement("li", "analytics-list__item");
    row.append(
      createElement("span", "", getLabel(item)),
      createElement("strong", "", getValue(item))
    );
    list.append(row);
  }

  section.append(heading, list.children.length ? list : createElement("p", "ingredient-empty", "No analytics available yet."));
  return section;
}

function renderDataQuality(summary) {
  const quality = summary.dataQuality;
  const totalIssues = Object.values(quality).reduce((total, value) => total + value, 0);
  const section = createElement("section", totalIssues ? "ingredient-warning" : "analytics-quality");
  const list = createElement("ul", "");

  section.append(createElement("h3", "", "Data Quality"));

  for (const [key, value] of Object.entries(quality)) {
    if (value > 0) {
      list.append(createElement("li", "", `${key.replace(/([A-Z])/g, " $1")}: ${value}`));
    }
  }

  if (!list.children.length) {
    section.append(createElement("p", "ingredient-empty", "No data quality issues detected for this selection."));
    return section;
  }

  section.append(list);
  return section;
}

export function renderAnalyticsDashboard(summary) {
  const panel = createElement("section", "analytics-panel");
  const header = createElement("header", "analytics-panel__header");
  const cards = createElement("div", "analytics-cards");
  const grid = createElement("div", "analytics-grid");

  header.append(
    createElement("h2", "", "Operational Analytics"),
    createElement("p", "", `${summary.filters.mealType || "Meal"} | ${summary.filters.week || "Week"} | charts-ready summary`)
  );

  for (const card of summary.summaryCards) {
    cards.append(renderSummaryCard(card));
  }

  grid.append(
    renderRankedList(
      "Highest Cost Recipes",
      summary.highestCostRecipes,
      (recipe) => recipe.title,
      (recipe) => formatValue(recipe.totalCost, "currency")
    ),
    renderRankedList(
      "Highest Cost Ingredients",
      summary.highestCostIngredients,
      (ingredient) => ingredient.ingredientName,
      (ingredient) => formatValue(ingredient.totalCost, "currency")
    ),
    renderRankedList(
      "Most Used Ingredients",
      summary.mostUsedIngredients,
      (ingredient) => ingredient.ingredientName,
      (ingredient) => `${ingredient.useCount} uses`
    ),
    renderRankedList(
      "Supplier Spending Estimates",
      summary.supplierSpending,
      (supplier) => supplier.supplierName,
      (supplier) => formatValue(supplier.estimatedSpend, "currency")
    ),
    renderRankedList(
      "Category Usage Breakdown",
      summary.categoryUsage,
      (category) => category.category,
      (category) => `${category.ingredientCount} items | ${formatValue(category.totalCost, "currency")}`
    )
  );

  panel.append(header, cards, grid, renderDataQuality(summary));
  return panel;
}

export function renderAnalyticsDashboardInto(container, summary) {
  if (!container) {
    throw new Error("An analytics container is required.");
  }

  container.replaceChildren(renderAnalyticsDashboard(summary));
}
