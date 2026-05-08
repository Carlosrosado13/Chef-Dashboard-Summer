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

function createInput(name, value = "", type = "text") {
  const input = createElement("input", "");
  input.name = name;
  input.type = type;
  input.value = value ?? "";
  return input;
}

function createIngredientRow(ingredient = {}) {
  const row = createElement("div", "recipe-create-row recipe-create-row--ingredient");
  const amount = createInput("ingredientAmount", ingredient.amount ?? "", "number");
  const unit = createInput("ingredientUnit", ingredient.unit || "");
  const name = createInput("ingredientName", ingredient.name || "");
  const remove = createElement("button", "draft-status__button recipe-create-remove", "Remove");

  amount.step = "any";
  amount.placeholder = "Amount";
  unit.placeholder = "Unit";
  name.placeholder = "Ingredient name";
  remove.type = "button";
  remove.addEventListener("click", () => row.remove());
  row.append(amount, unit, name, remove);
  return row;
}

function createStepRow(step = "") {
  const row = createElement("div", "recipe-create-row recipe-create-row--step");
  const input = createInput("step", step);
  const remove = createElement("button", "draft-status__button recipe-create-remove", "Remove");

  input.placeholder = "Preparation step";
  remove.type = "button";
  remove.addEventListener("click", () => row.remove());
  row.append(input, remove);
  return row;
}

function createField(name, label, value = "") {
  const wrapper = createElement("label", "admin-field");
  wrapper.append(createElement("span", "", label), createInput(name, value));
  return wrapper;
}

function createJsonField(name, label, value) {
  const wrapper = createElement("label", "admin-field");
  const textarea = createElement("textarea", "");
  textarea.name = name;
  textarea.rows = 5;
  textarea.placeholder = "{ \"source\": \"...\" }";
  textarea.value = value === undefined ? "" : JSON.stringify(value, null, 2);
  wrapper.append(createElement("span", "", label), textarea);
  return wrapper;
}

export function createEmptyRecipeDraft() {
  return {
    title: "",
    yield: "",
    category: "",
    ingredients: [
      {
        name: "",
        amount: 0,
        unit: ""
      }
    ],
    steps: [""],
    notes: [],
    tags: []
  };
}

export function renderRecipeCreateWizard(container, draft, options = {}) {
  const recipe = draft || createEmptyRecipeDraft();
  const form = createElement("form", "recipe-editor-form recipe-create-form");
  const title = createElement("h2", "", "Create New Recipe");
  const ingredientsTitle = createElement("h3", "", "Ingredients");
  const ingredientRows = createElement("div", "recipe-create-rows");
  const addIngredient = createElement("button", "filter-button", "Add Ingredient");
  const stepsTitle = createElement("h3", "", "Steps");
  const stepRows = createElement("div", "recipe-create-rows");
  const addStep = createElement("button", "filter-button", "Add Step");
  const notesField = createElement("label", "admin-field");
  const notes = createElement("textarea", "");
  const preview = createElement("section", "recipe-create-preview");
  const actions = createElement("div", "admin-actions");
  const validateButton = createElement("button", "filter-button", "Preview Create Patch");
  const resetButton = createElement("button", "filter-button", "Reset");
  const cancelButton = createElement("button", "filter-button", "Cancel");

  for (const ingredient of recipe.ingredients || []) {
    ingredientRows.append(createIngredientRow(ingredient));
  }

  for (const step of recipe.steps || []) {
    stepRows.append(createStepRow(step));
  }

  notes.name = "notes";
  notes.rows = 5;
  notes.placeholder = "One note per line";
  notes.value = (recipe.notes || []).join("\n");
  notesField.append(createElement("span", "", "Notes"), notes);

  addIngredient.type = "button";
  addIngredient.addEventListener("click", () => {
    ingredientRows.append(createIngredientRow());
    options.onChange?.(readCreateRecipeForm(form));
  });

  addStep.type = "button";
  addStep.addEventListener("click", () => {
    stepRows.append(createStepRow());
    options.onChange?.(readCreateRecipeForm(form));
  });

  validateButton.type = "submit";
  resetButton.type = "button";
  cancelButton.type = "button";
  resetButton.addEventListener("click", options.onReset);
  cancelButton.addEventListener("click", options.onCancel);
  actions.append(validateButton, resetButton, cancelButton);

  form.append(
    title,
    createField("title", "Title", recipe.title),
    createField("yield", "Yield", recipe.yield),
    createField("category", "Category", recipe.category),
    ingredientsTitle,
    ingredientRows,
    addIngredient,
    stepsTitle,
    stepRows,
    addStep,
    notesField,
    createField("tags", "Tags", (recipe.tags || []).join(", ")),
    createJsonField("metadata", "Metadata", recipe.metadata),
    preview,
    actions
  );

  form.addEventListener("input", () => {
    const currentDraft = readCreateRecipeForm(form);
    renderCreatePreview(preview, currentDraft);
    options.onChange?.(currentDraft);
  });
  form.addEventListener("click", (event) => {
    if (!event.target.classList.contains("recipe-create-remove")) {
      return;
    }

    window.setTimeout(() => {
      const currentDraft = readCreateRecipeForm(form);
      renderCreatePreview(preview, currentDraft);
      options.onChange?.(currentDraft);
    });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    options.onValidate?.(readCreateRecipeForm(form));
  });

  renderCreatePreview(preview, recipe);
  container.replaceChildren(form);
}

export function readCreateRecipeForm(form) {
  const formData = new FormData(form);
  const amounts = formData.getAll("ingredientAmount");
  const units = formData.getAll("ingredientUnit");
  const names = formData.getAll("ingredientName");
  const steps = formData
    .getAll("step")
    .map((step) => String(step).trim())
    .filter(Boolean);

  const recipe = {
    title: String(formData.get("title") || "").trim(),
    yield: String(formData.get("yield") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    ingredients: names
      .map((name, index) => ({
        name: String(name || "").trim(),
        amount: Number(amounts[index]),
        unit: String(units[index] || "").trim()
      }))
      .filter((ingredient) => ingredient.name || ingredient.unit || Number.isFinite(ingredient.amount)),
    steps,
    notes: String(formData.get("notes") || "")
      .split("\n")
      .map((note) => note.trim())
      .filter(Boolean)
  };

  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tags.length > 0) {
    recipe.tags = tags;
  }

  const metadataValue = String(formData.get("metadata") || "").trim();
  if (metadataValue) {
    try {
      recipe.metadata = JSON.parse(metadataValue);
    } catch {
      recipe.metadata = metadataValue;
    }
  }

  return recipe;
}

function renderCreatePreview(container, recipe) {
  container.replaceChildren();
  container.append(
    createElement("h3", "", "Preview"),
    createElement("p", "admin-muted", `${recipe.title || "Untitled recipe"} | ${recipe.yield || "No yield"} | ${recipe.category || "No category"}`),
    createElement("pre", "patch-preview", JSON.stringify(recipe, null, 2))
  );
}
