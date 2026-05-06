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

  return "Review";
}

function formatCurrency(amount) {
  if (!Number.isFinite(amount)) {
    return "Estimate unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

function renderContact(contactInfo = {}) {
  const contact = createElement("p", "purchase-order__contact");
  const parts = [contactInfo.email, contactInfo.phone].filter(Boolean);
  contact.textContent = parts.length ? parts.join(" | ") : "No supplier contact on file.";
  return contact;
}

function renderPurchaseLine(line) {
  const item = createElement("li", "purchase-line");
  const name = createElement("span", "purchase-line__name", line.ingredientName);
  const quantity = createElement("span", "purchase-line__quantity", `${formatAmount(line.quantity)} ${line.unit}`.trim());
  const estimate = createElement("span", "purchase-line__estimate", formatCurrency(line.estimatedLineTotal));

  item.append(name, quantity, estimate);

  if (line.reviewNotes.length > 0) {
    const notes = createElement("ul", "purchase-line__notes");
    for (const note of line.reviewNotes) {
      notes.append(createElement("li", "", note));
    }
    item.append(notes);
  }

  return item;
}

function renderCategoryGroup(group) {
  const section = createElement("details", "purchase-category");
  const summary = createElement("summary", "purchase-category__title");
  const title = createElement("span", "", group.category);
  const count = createElement("span", "purchase-category__count", `${group.count} item${group.count === 1 ? "" : "s"} | ${formatCurrency(group.estimatedTotal)}`);
  const list = createElement("ul", "purchase-list");

  section.open = true;
  summary.append(title, count);

  for (const line of group.items) {
    list.append(renderPurchaseLine(line));
  }

  section.append(summary, list);
  return section;
}

function renderSupplierOrder(order) {
  const section = createElement("section", "purchase-order");
  const header = createElement("header", "purchase-order__header");
  const title = createElement("h3", "", order.supplierName);
  const meta = createElement(
    "p",
    "",
    `${order.itemCount} order items | ${order.shortageCount} shortages | ${formatCurrency(order.estimatedTotal)}`
  );
  const groups = createElement("div", "purchase-order__groups");

  header.append(title, meta, renderContact(order.contactInfo));

  for (const group of order.categoryGroups) {
    groups.append(renderCategoryGroup(group));
  }

  section.append(header, groups);
  return section;
}

function renderMissingSuppliers(categories) {
  if (!categories.length) {
    return null;
  }

  const section = createElement("section", "ingredient-warning");
  section.append(createElement("h3", "", "Supplier review needed"));
  const list = createElement("ul", "");

  for (const category of categories) {
    list.append(createElement("li", "", `${category}: no supplier is configured for this category.`));
  }

  section.append(list);
  return section;
}

export function renderPurchaseOrders(summary) {
  const panel = createElement("section", "purchase-panel");
  const header = createElement("header", "purchase-panel__header");
  const title = createElement("h2", "", "Purchase Order Preview");
  const meta = createElement(
    "p",
    "",
    `${summary.requirementCount} purchase requirements | ${summary.shortageCount} shortages | ${formatCurrency(summary.estimatedGrandTotal)} estimated`
  );

  header.append(title, meta);
  panel.append(header);

  if (!summary.supplierOrders.length) {
    panel.append(createElement("p", "ingredient-empty", "No purchase requirements are needed for this selection yet."));
    return panel;
  }

  const orders = createElement("div", "purchase-panel__orders");
  for (const order of summary.supplierOrders) {
    orders.append(renderSupplierOrder(order));
  }
  panel.append(orders);

  const missingSuppliers = renderMissingSuppliers(summary.missingSupplierCategories);
  if (missingSuppliers) {
    panel.append(missingSuppliers);
  }

  return panel;
}

export function renderPurchaseOrdersInto(container, summary) {
  if (!container) {
    throw new Error("A purchase order container is required.");
  }

  container.replaceChildren(renderPurchaseOrders(summary));
}
