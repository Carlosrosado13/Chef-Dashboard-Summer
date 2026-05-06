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

function formatValue(value) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function renderBlockedPatch(patch) {
  const panel = createElement("section", "patch-panel patch-panel--blocked");
  panel.append(createElement("p", "admin-errors", patch.reason));

  if (patch.errors?.length) {
    const list = createElement("ul", "admin-errors");
    for (const error of patch.errors) {
      list.append(createElement("li", "", error.message));
    }
    panel.append(list);
  }

  return panel;
}

function renderChangedField(field, change) {
  const section = createElement("section", "patch-field");
  const heading = createElement("h3", "patch-field__title", field);
  const values = createElement("div", "patch-field__values");
  const original = createElement("pre", "patch-field__value patch-field__value--original", formatValue(change.original));
  const updated = createElement("pre", "patch-field__value patch-field__value--updated", formatValue(change.updated));

  values.append(
    createElement("span", "patch-field__label", "Original"),
    createElement("span", "patch-field__label", "Updated"),
    original,
    updated
  );
  section.append(heading, values);

  return section;
}

export function renderPatchPreview(container, patch) {
  container.replaceChildren();

  if (!patch || Object.keys(patch).length === 0) {
    container.append(createElement("p", "admin-muted", "Patch preview will appear after selecting and editing a recipe."));
    return;
  }

  if (!patch.ok) {
    container.append(renderBlockedPatch(patch));
    return;
  }

  const panel = createElement("section", "patch-panel");
  const summary = createElement(
    "p",
    "admin-muted",
    `${patch.operation} | ${patch.source} | ${patch.timestamp}`
  );
  panel.append(summary);

  if (!patch.hasChanges) {
    panel.append(createElement("p", "admin-muted", "No changed fields yet."));
  } else {
    for (const [field, change] of Object.entries(patch.changedFields)) {
      panel.append(renderChangedField(field, change));
    }
  }

  const raw = createElement("pre", "patch-preview", JSON.stringify(patch, null, 2));
  panel.append(raw);
  container.append(panel);
}
