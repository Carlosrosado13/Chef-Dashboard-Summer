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

function renderNotice(notice) {
  if (!notice) {
    return null;
  }

  const message = createElement("p", `save-status save-status--${notice.tone}`, notice.message);
  return message;
}

function createSaveMessage(patch) {
  if (!patch || Object.keys(patch).length === 0) {
    return {
      tone: "neutral",
      title: "Missing Required Fields",
      message: "Choose a recipe or start a new one."
    };
  }

  if (!patch.ok) {
    return {
      tone: "error",
      title: "Missing Required Fields",
      message: "Complete Recipe Name, Category, Ingredients, and Steps."
    };
  }

  if (patch.hasChanges) {
    return {
      tone: "success",
      title: "Ready to Save",
      message: "Save will update the recipe and place it on the selected menu slot."
    };
  }

  return {
    tone: "success",
    title: "Ready to Save",
    message: "Save will place this recipe on the selected menu slot."
  };
}

export function renderPatchPreview(container, patch, options = {}) {
  container.replaceChildren();

  const notice = renderNotice(options.notice);
  if (notice) {
    container.append(notice);
  }

  const status = createSaveMessage(patch);
  const panel = createElement("section", `save-panel save-panel--${status.tone}`);
  const title = createElement("h3", "", options.notice ? "Patch Applied" : status.title);
  const message = createElement("p", "admin-muted", options.notice ? "Save Success" : status.message);
  const actions = createElement("div", "patch-actions");
  const saveButton = createElement("button", "filter-button", "Save Recipe");
  const undoButton = createElement("button", "filter-button", "Undo Last Save");

  saveButton.type = "button";
  undoButton.type = "button";
  saveButton.disabled = !patch?.ok || !["updateRecipe", "createRecipe"].includes(patch.operation);
  undoButton.disabled = !options.canRollback;
  saveButton.addEventListener("click", () => options.onApply?.());
  undoButton.addEventListener("click", () => options.onRollback?.());
  actions.append(saveButton, undoButton);
  panel.append(title, message, actions);
  container.append(panel);
}
