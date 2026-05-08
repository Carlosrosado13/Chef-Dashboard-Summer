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

function createInputField(name, label, value) {
  const wrapper = createElement("label", "admin-field");
  const labelText = createElement("span", "", label);
  const input = createElement("input", "");
  input.name = name;
  input.value = value || "";

  wrapper.append(labelText, input);
  return wrapper;
}

function createJsonTextareaField(name, label, value, placeholder) {
  const wrapper = createElement("label", "admin-field");
  const labelText = createElement("span", "", label);
  const textarea = createElement("textarea", "");
  textarea.name = name;
  textarea.rows = 6;
  textarea.placeholder = placeholder;
  textarea.value = value === undefined ? "" : JSON.stringify(value, null, 2);

  wrapper.append(labelText, textarea);
  return wrapper;
}

function createTextareaField(name, label, values, placeholder) {
  const wrapper = createElement("label", "admin-field");
  const labelText = createElement("span", "", label);
  const textarea = createElement("textarea", "");
  textarea.name = name;
  textarea.rows = 8;
  textarea.placeholder = placeholder;
  textarea.value = (values || []).join("\n");

  wrapper.append(labelText, textarea);
  return wrapper;
}

function formatIngredients(ingredients) {
  return (ingredients || [])
    .map((ingredient) => `${ingredient.amount ?? ""} | ${ingredient.unit ?? ""} | ${ingredient.name ?? ""}`)
    .join("\n");
}

export function renderRecipeList(container, recipes, selectedIndex, onSelect) {
  container.replaceChildren();

  if (recipes.length === 0) {
    container.append(createElement("p", "admin-empty", "No recipes match the current search."));
    return;
  }

  for (const recipe of recipes) {
    const button = createElement("button", "recipe-list__item");
    button.type = "button";
    button.textContent = recipe.title;
    button.dataset.index = recipe.index;
    button.setAttribute("aria-pressed", String(recipe.index === selectedIndex));
    button.addEventListener("click", () => onSelect(recipe.index));
    container.append(button);
  }
}

export function renderRecipeEditor(container, recipe, options = {}) {
  if (!recipe) {
    const empty = createElement("div", "admin-empty");
    empty.append(
      createElement("h2", "", "Select a recipe"),
      createElement("p", "", "Choose a recipe from the list to begin editing.")
    );
    container.replaceChildren(empty);
    return;
  }

  const form = createElement("form", "recipe-editor-form");
  form.append(
    createElement("h2", "", "Recipe Editor"),
    createInputField("title", "Title", recipe.title),
    createInputField("yield", "Yield", recipe.yield),
    createInputField("category", "Category", recipe.category),
    createTextareaField(
      "ingredients",
      "Ingredients",
      formatIngredients(recipe.ingredients).split("\n").filter(Boolean),
      "amount | unit | name"
    ),
    createTextareaField("steps", "Steps", recipe.steps, "One step per line"),
    createTextareaField("notes", "Notes", recipe.notes, "One note per line"),
    createInputField("tags", "Tags", (recipe.tags || []).join(", ")),
    createJsonTextareaField("metadata", "Metadata", recipe.metadata, "{ \"source\": \"...\" }")
  );

  const actions = createElement("div", "admin-actions");
  const validateButton = createElement("button", "filter-button", "Validate");
  const resetButton = createElement("button", "filter-button", "Reset");
  const cancelButton = createElement("button", "filter-button", "Cancel");

  validateButton.type = "submit";
  resetButton.type = "button";
  cancelButton.type = "button";
  resetButton.addEventListener("click", options.onReset);
  cancelButton.addEventListener("click", options.onCancel);
  actions.append(validateButton, resetButton, cancelButton);
  form.append(actions);

  form.addEventListener("input", () => options.onChange?.(readRecipeForm(form, recipe)));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    options.onValidate?.(readRecipeForm(form, recipe));
  });

  container.replaceChildren(form);
}

export function readRecipeForm(form, baseRecipe = {}) {
  const formData = new FormData(form);
  const recipe = {
    ...structuredClone(baseRecipe),
    title: String(formData.get("title") || "").trim(),
    yield: String(formData.get("yield") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    ingredients: parseIngredients(String(formData.get("ingredients") || "")),
    steps: String(formData.get("steps") || "")
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean),
    notes: String(formData.get("notes") || "")
      .split("\n")
      .map((note) => note.trim())
      .filter(Boolean)
  };

  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tags.length > 0 || Object.hasOwn(baseRecipe, "tags")) {
    recipe.tags = tags;
  }

  const metadataValue = String(formData.get("metadata") || "").trim();
  if (metadataValue) {
    try {
      recipe.metadata = JSON.parse(metadataValue);
    } catch {
      recipe.metadata = metadataValue;
    }
  } else if (Object.hasOwn(baseRecipe, "metadata")) {
    delete recipe.metadata;
  }

  return recipe;
}

function parseIngredients(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [amount, unit, ...nameParts] = line.split("|").map((part) => part.trim());
      return {
        amount: Number(amount),
        unit: unit || "",
        name: nameParts.join(" | ") || ""
      };
    });
}

export function renderValidation(container, result) {
  container.replaceChildren();

  if (!result) {
    container.append(createElement("p", "admin-muted", "Validation results will appear here."));
    return;
  }

  if (result.ok) {
    container.append(createElement("p", "admin-valid", "Recipe is valid."));
    return;
  }

  const list = createElement("ul", "admin-errors");
  for (const error of result.errors) {
    list.append(createElement("li", "", error.message));
  }
  container.append(list);
}
