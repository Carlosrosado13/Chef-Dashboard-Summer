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

function formatAmount(amount) {
  if (Number.isFinite(amount)) {
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  }

  return "Unknown";
}

function renderInventoryLine(line) {
  const item = createElement("li", `inventory-list__item inventory-list__item--${line.status}`);
  const name = createElement("span", "inventory-list__name", line.name);
  const required = createElement("span", "inventory-list__metric", `Need ${formatAmount(line.requiredQuantity)} ${line.requiredUnit}`.trim());
  const current = createElement(
    "span",
    "inventory-list__metric",
    line.status === "missing"
      ? "No inventory record"
      : `On hand ${formatAmount(line.currentQuantity)} ${line.inventoryUnit}`.trim()
  );
  const remaining = createElement("span", "inventory-list__status", getStatusText(line));

  item.append(name, required, current, remaining);
  return item;
}

function getStatusText(line) {
  if (line.status === "missing") {
    return "Add inventory entry";
  }

  if (line.status === "unit-mismatch") {
    return `Unit mismatch: menu uses ${line.requiredUnit || "none"}, inventory uses ${line.inventoryUnit || "none"}`;
  }

  if (line.status === "shortage") {
    return `Short ${formatAmount(line.shortageQuantity)} ${line.requiredUnit}`.trim();
  }

  if (line.status === "low") {
    return `Low after use: ${formatAmount(line.remainingQuantity)} ${line.requiredUnit}`.trim();
  }

  return `Remaining ${formatAmount(line.remainingQuantity)} ${line.requiredUnit}`.trim();
}

function renderInventoryGroup(group, isOpen) {
  const section = createElement("details", "inventory-group");
  const summary = createElement("summary", "inventory-group__title");
  const title = createElement("span", "", group.category);
  const count = createElement(
    "span",
    "inventory-group__count",
    `${group.count} item${group.count === 1 ? "" : "s"} | ${group.shortages} short | ${group.lowStock} low`
  );
  const list = createElement("ul", "inventory-list");

  section.open = isOpen || group.shortages > 0 || group.lowStock > 0 || group.missing > 0;
  summary.append(title, count);

  for (const line of group.items) {
    list.append(renderInventoryLine(line));
  }

  section.append(summary, list);
  return section;
}

function renderInventoryWarnings(summary) {
  if (summary.missingCount === 0 && summary.unitIssues.length === 0) {
    return null;
  }

  const section = createElement("section", "ingredient-warning");
  section.append(createElement("h3", "", "Inventory review needed"));
  const list = createElement("ul", "");

  for (const item of summary.missingInventory) {
    list.append(createElement("li", "", `${item.name}: missing inventory entry`));
  }

  for (const item of summary.unitIssues) {
    list.append(createElement("li", "", `${item.name}: ${item.requiredUnit || "no unit"} needed, ${item.inventoryUnit || "no unit"} on hand`));
  }

  section.append(list);
  return section;
}

export function renderInventoryPanel(summary) {
  const panel = createElement("section", "inventory-panel");
  const header = createElement("header", "inventory-panel__header");
  const title = createElement("h2", "", "Inventory Planning");
  const meta = createElement(
    "p",
    "",
    `${summary.shortageCount} shortages | ${summary.lowStockCount} low stock alerts | ${summary.missingCount} missing entries`
  );

  header.append(title, meta);
  panel.append(header);

  if (!summary.lines.length) {
    panel.append(createElement("p", "ingredient-empty", "No ingredient demand is available for inventory planning yet."));
    return panel;
  }

  const groups = createElement("div", "inventory-panel__groups");
  for (const [index, group] of summary.grouped.entries()) {
    groups.append(renderInventoryGroup(group, index === 0));
  }
  panel.append(groups);

  const warnings = renderInventoryWarnings(summary);
  if (warnings) {
    panel.append(warnings);
  }

  return panel;
}

export function renderInventoryPanelInto(container, summary) {
  if (!container) {
    throw new Error("An inventory container is required.");
  }

  container.replaceChildren(renderInventoryPanel(summary));
}
