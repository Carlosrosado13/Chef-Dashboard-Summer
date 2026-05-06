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

function formatValue(value, format, suffix = "") {
  if (format === "currency") {
    if (!Number.isFinite(value)) {
      return "Review";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value);
  }

  const formatted = Number.isFinite(value) ? String(value) : "0";
  return suffix ? `${formatted} ${suffix}` : formatted;
}

function renderCard(card) {
  const item = createElement("div", "forecast-card");
  item.append(
    createElement("span", "forecast-card__label", card.label),
    createElement("strong", "forecast-card__value", formatValue(card.value, card.format, card.suffix))
  );
  return item;
}

function renderList(title, items, getLabel, getValue, emptyText = "No forecast data available yet.") {
  const section = createElement("section", "forecast-section");
  const heading = createElement("h3", "", title);
  const list = createElement("ol", "forecast-list");

  for (const item of items.slice(0, 8)) {
    const row = createElement("li", "forecast-list__item");
    row.append(
      createElement("span", "", getLabel(item)),
      createElement("strong", "", getValue(item))
    );
    list.append(row);
  }

  section.append(heading, list.children.length ? list : createElement("p", "ingredient-empty", emptyText));
  return section;
}

function renderAlerts(alerts) {
  const section = createElement("section", alerts.length ? "forecast-alerts forecast-alerts--active" : "forecast-alerts");
  const list = createElement("ul", "forecast-alert-list");

  section.append(createElement("h3", "", "Upcoming Shortage Alerts"));

  for (const alert of alerts.slice(0, 10)) {
    const item = createElement("li", `forecast-alert-list__item forecast-alert-list__item--${alert.alertLevel}`);
    const timing = alert.weeksUntilDepleted === null
      ? "review needed"
      : `${alert.weeksUntilDepleted} week${alert.weeksUntilDepleted === 1 ? "" : "s"} remaining`;
    item.append(
      createElement("span", "", alert.ingredientName),
      createElement("strong", "", timing)
    );
    list.append(item);
  }

  section.append(list.children.length ? list : createElement("p", "ingredient-empty", "No upcoming shortage alerts for the forecast window."));
  return section;
}

function renderDataQuality(summary) {
  const issues = Object.entries(summary.dataQuality || {}).filter((entry) => entry[1] > 0);

  if (!issues.length) {
    return null;
  }

  const section = createElement("section", "ingredient-warning");
  const list = createElement("ul", "");

  section.append(createElement("h3", "", "Forecast data review needed"));
  for (const [key, value] of issues) {
    list.append(createElement("li", "", `${key.replace(/([A-Z])/g, " $1")}: ${value}`));
  }
  section.append(list);
  return section;
}

export function renderForecastDashboard(summary) {
  const panel = createElement("section", "forecast-panel");
  const header = createElement("header", "forecast-panel__header");
  const cards = createElement("div", "forecast-cards");
  const grid = createElement("div", "forecast-grid");
  const trend = summary.trendSummary?.weeklyCostTrend;

  header.append(
    createElement("h2", "", "Forecast Planning"),
    createElement("p", "", `${summary.filters.mealType || "Meal"} | ${summary.filters.week || "Week"} | ${summary.options.horizonWeeks}-week projection`)
  );

  for (const card of summary.summaryCards) {
    cards.append(renderCard(card));
  }

  grid.append(
    renderList(
      "Projected Ingredient Usage",
      summary.projectedIngredientUsage,
      (ingredient) => ingredient.ingredientName,
      (ingredient) => `${formatValue(ingredient.projectedQuantity, "number")} ${ingredient.unit}`.trim()
    ),
    renderList(
      "Projected Supplier Spending",
      summary.projectedSupplierSpending,
      (supplier) => supplier.supplierName,
      (supplier) => formatValue(supplier.projectedSpend, "currency")
    ),
    renderList(
      "Projected Category Spending",
      summary.projectedCategorySpending,
      (category) => category.category,
      (category) => formatValue(category.projectedSpend, "currency")
    ),
    renderList(
      "Future Ordering Needs",
      summary.futureOrderingNeeds,
      (item) => item.ingredientName,
      (item) => `${formatValue(item.orderQuantity, "number")} ${item.unit}`.trim()
    ),
    renderList(
      "Projected Weekly Menu Costs",
      summary.projectedWeeklyMenuCosts,
      (week) => week.label,
      (week) => formatValue(week.cost, "currency")
    )
  );

  const trendPanel = createElement("section", "forecast-trend");
  trendPanel.append(
    createElement("h3", "", "Trend Summary"),
    createElement("p", "", `Weekly cost trend: ${trend?.direction || "flat"} (${trend?.confidence || "none"} confidence).`)
  );

  panel.append(header, cards, renderAlerts(summary.upcomingShortageAlerts), grid, trendPanel);

  const dataQuality = renderDataQuality(summary);
  if (dataQuality) {
    panel.append(dataQuality);
  }

  return panel;
}

export function renderForecastDashboardInto(container, summary) {
  if (!container) {
    throw new Error("A forecast container is required.");
  }

  container.replaceChildren(renderForecastDashboard(summary));
}
