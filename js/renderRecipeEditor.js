const CATEGORY_OPTIONS = [
  { label: "Appetizer 1", value: "Appetizer 1" },
  { label: "Appetizer 2", value: "Appetizer 2" },
  { label: "Elevated", value: "Elevated" },
  { label: "Comfort", value: "Comfort" },
  { label: "Alternative", value: "Alternative" },
  { label: "Veggie 1", value: "Veggie 1" },
  { label: "Veggie 2", value: "Veggie 2" },
  { label: "Starch", value: "Starch" },
  { label: "Dessert", value: "Dessert" }
];
const LEGACY_CATEGORY_ALIASES = {
  Traditional: "Comfort",
  "Veg 1": "Veggie 1",
  "Veg 2": "Veggie 2"
};
const WEEK_OPTIONS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const NEW_RECIPE_SLOT = "__new_recipe__";
const KNOWN_UNITS = new Set([
  "bag", "bags", "bunch", "bunches", "can", "cans", "case", "cases", "clove", "cloves",
  "cup", "cups", "each", "ea", "fl", "gal", "g", "kg", "lb", "lbs", "oz", "pt", "qt",
  "t", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons"
]);

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

function createInputField(name, label, value, placeholder = "", attributes = {}) {
  const wrapper = createElement("label", "admin-field");
  const labelText = createElement("span", "", label);
  const input = createElement("input", "");
  input.name = name;
  input.value = value || "";
  input.placeholder = placeholder;

  for (const [attribute, attributeValue] of Object.entries(attributes)) {
    input[attribute] = attributeValue;
  }

  wrapper.append(labelText, input);
  return wrapper;
}

function createSelectField(name, label, value, options, attributes = {}) {
  const wrapper = createElement("label", "admin-field");
  const select = createElement("select", "");
  select.name = name;

  for (const [attribute, attributeValue] of Object.entries(attributes)) {
    select.dataset[attribute] = attributeValue;
  }

  for (const option of options) {
    const optionElement = createElement("option", "", option.label || option);
    optionElement.value = option.value || option;
    optionElement.selected = optionElement.value === value;
    if (option.recipeTitle !== undefined) {
      optionElement.dataset.recipeTitle = option.recipeTitle;
    }
    select.append(optionElement);
  }

  wrapper.append(createElement("span", "", label), select);
  return wrapper;
}

function createTextareaField(name, label, value, placeholder, rows = 8) {
  const wrapper = createElement("label", "admin-field production-recipe-form__textarea");
  const labelText = createElement("span", "", label);
  const textarea = createElement("textarea", "");
  textarea.name = name;
  textarea.rows = rows;
  textarea.placeholder = placeholder;
  textarea.value = value || "";

  wrapper.append(labelText, textarea);
  return wrapper;
}

function createRecipePhotoField(recipe, options = {}) {
  const section = createElement("section", "recipe-photo-editor");
  const heading = createElement("h3", "", "Dessert Photo");
  const controls = createElement("div", "recipe-photo-editor__modes");
  const uploadButton = createElement("button", "filter-button", "Upload Photo");
  const urlButton = createElement("button", "filter-button", "Paste Image URL");
  const uploadPanel = createElement("div", "recipe-photo-editor__upload");
  const dropZone = createElement("label", "recipe-photo-dropzone");
  const dropTitle = createElement("strong", "", "Drag and drop an image here");
  const dropCopy = createElement("span", "", "or browse files from your device");
  const browseLabel = createElement("span", "filter-button recipe-photo-dropzone__browse", "Browse Files");
  const fileInput = createElement("input", "recipe-photo-dropzone__input");
  const urlPanel = createElement("label", "admin-field recipe-photo-editor__url");
  const urlInput = createElement("input", "");
  const preview = createElement("div", "recipe-photo-preview");
  const previewImage = createElement("img", "recipe-photo-preview__image");
  const emptyPreview = createElement("p", "admin-muted", "No dessert photo selected.");
  const status = createElement("p", "recipe-photo-editor__status", "");
  const removeButton = createElement("button", "filter-button filter-button--danger", "Delete Photo");
  let activeMode = recipe.photoUrl ? "url" : "upload";

  uploadButton.type = "button";
  urlButton.type = "button";
  fileInput.type = "file";
  fileInput.accept = options.photoAccept || "image/jpeg,image/png,image/webp";
  fileInput.name = "photoFile";
  urlInput.type = "url";
  urlInput.name = "photoUrl";
  urlInput.value = recipe.photoUrl || "";
  urlInput.placeholder = "https://example.com/dessert.jpg";
  urlInput.inputMode = "url";
  previewImage.alt = recipe.title ? `${recipe.title} dessert photo preview` : "Dessert photo preview";
  removeButton.type = "button";
  dropZone.tabIndex = 0;
  dropZone.append(dropTitle, dropCopy, browseLabel, fileInput);
  uploadPanel.append(dropZone);
  urlPanel.append(createElement("span", "", "Image URL"), urlInput);

  function renderMode() {
    const uploadActive = activeMode === "upload";
    uploadPanel.hidden = !uploadActive;
    urlPanel.hidden = uploadActive;
    uploadButton.setAttribute("aria-pressed", String(uploadActive));
    urlButton.setAttribute("aria-pressed", String(!uploadActive));
  }

  function renderPreview() {
    const photoUrl = urlInput.value.trim();
    removeButton.hidden = !photoUrl;
    preview.replaceChildren();

    if (!photoUrl) {
      preview.append(emptyPreview);
      return;
    }

    previewImage.src = photoUrl;
    previewImage.hidden = false;
    previewImage.addEventListener("error", () => {
      previewImage.hidden = true;
      status.textContent = "The image preview could not be loaded.";
      status.dataset.tone = "error";
    }, { once: true });
    preview.append(previewImage);
  }

  function emitPhotoChange() {
    urlInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function handleFile(file) {
    if (!file || typeof options.onPhotoUpload !== "function") {
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    previewImage.src = localPreviewUrl;
    previewImage.hidden = false;
    preview.replaceChildren(previewImage);
    status.textContent = "Uploading photo...";
    status.dataset.tone = "neutral";
    fileInput.disabled = true;

    try {
      const result = await options.onPhotoUpload(file, formTitle());
      urlInput.value = result.photoUrl;
      activeMode = "upload";
      renderMode();
      renderPreview();
      emitPhotoChange();
      status.textContent = "Photo uploaded. Save the recipe to keep this photo assignment.";
      status.dataset.tone = "success";
    } catch (error) {
      status.textContent = error.message || "Photo upload failed.";
      status.dataset.tone = "error";
      renderPreview();
    } finally {
      fileInput.disabled = false;
      fileInput.value = "";
      URL.revokeObjectURL(localPreviewUrl);
    }
  }

  function formTitle() {
    return section.closest("form")?.elements.namedItem("title")?.value || recipe.title || "Dessert";
  }

  uploadButton.addEventListener("click", () => {
    activeMode = "upload";
    renderMode();
  });
  urlButton.addEventListener("click", () => {
    activeMode = "url";
    renderMode();
    urlInput.focus();
  });
  fileInput.addEventListener("change", () => handleFile(fileInput.files?.[0]));
  urlInput.addEventListener("input", () => {
    status.textContent = "";
    renderPreview();
  });
  removeButton.addEventListener("click", () => {
    urlInput.value = "";
    renderPreview();
    emitPhotoChange();
    status.textContent = "Photo removed. Save the recipe to apply this change.";
    status.dataset.tone = "success";
  });
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("recipe-photo-dropzone--active");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("recipe-photo-dropzone--active");
  });
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("recipe-photo-dropzone--active");
    handleFile(event.dataTransfer?.files?.[0]);
  });
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  controls.append(uploadButton, createElement("span", "admin-muted", "or"), urlButton);
  section.append(heading, controls, uploadPanel, urlPanel, createElement("h4", "", "Preview Image"), preview, status, removeButton);
  renderMode();
  renderPreview();
  return section;
}

function formatIngredients(ingredients) {
  return (ingredients || [])
    .map((ingredient) => {
      if (typeof ingredient === "string") {
        return ingredient;
      }

      const amount = ingredient.amount === 0 || ingredient.amount ? ingredient.amount : "";
      return [amount, ingredient.unit, ingredient.name].filter((part) => String(part ?? "").trim()).join(" ");
    })
    .join("\n");
}

function formatSteps(steps) {
  return (steps || []).map((step, index) => `${index + 1}. ${step}`).join("\n");
}

function normalizeCategory(value) {
  const text = String(value || "").trim();
  const category = LEGACY_CATEGORY_ALIASES[text] || text;

  return CATEGORY_OPTIONS.some((option) => option.value === category) ? category : "Elevated";
}

function getDayMenu(menuData, assignment) {
  return menuData?.[assignment.mealType || "dinner"]?.weeks?.[assignment.week]?.days?.[assignment.day] || null;
}

function resolveDayMenuCategory(dayMenu, category) {
  const normalizedCategory = normalizeCategory(category);

  if (Object.hasOwn(dayMenu || {}, normalizedCategory)) {
    return normalizedCategory;
  }

  const legacyCategory = Object.entries(LEGACY_CATEGORY_ALIASES)
    .find(([, canonicalCategory]) => canonicalCategory === normalizedCategory)?.[0];

  return legacyCategory && Object.hasOwn(dayMenu || {}, legacyCategory)
    ? legacyCategory
    : normalizedCategory;
}

function cleanMenuRecipeName(value) {
  return String(value || "")
    .replace(/^Hot Appetizer:\s*/i, "")
    .trim();
}

function createMenuSlotOptions(menuData, assignment) {
  const dayMenu = getDayMenu(menuData, assignment);
  const options = CATEGORY_OPTIONS.map((option) => {
    const category = resolveDayMenuCategory(dayMenu, option.value);
    const currentRecipe = cleanMenuRecipeName(dayMenu?.[category]);

    return {
      value: option.value,
      label: currentRecipe ? `${option.label} \u2014 ${currentRecipe}` : `${option.label} \u2014 Unassigned`,
      recipeTitle: currentRecipe
    };
  });

  options.push({
    value: NEW_RECIPE_SLOT,
    label: "+ New Recipe",
    recipeTitle: ""
  });

  return options;
}

function replaceSelectOptions(select, options, selectedValue) {
  select.replaceChildren();

  for (const option of options) {
    const optionElement = createElement("option", "", option.label || option);
    optionElement.value = option.value || option;
    optionElement.selected = optionElement.value === selectedValue;
    if (option.recipeTitle !== undefined) {
      optionElement.dataset.recipeTitle = option.recipeTitle;
    }
    select.append(optionElement);
  }
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
      createElement("h2", "", "Choose a recipe"),
      createElement("p", "", "Select a recipe or start a new one.")
    );
    container.replaceChildren(empty);
    return;
  }

  const assignment = {
    mealType: options.assignment?.mealType || "dinner",
    week: options.assignment?.week || "Week 1",
    day: options.assignment?.day || "Monday",
    category: normalizeCategory(options.assignment?.category || recipe.category),
    slotMode: options.assignment?.slotMode || "existing"
  };
  const selectedCategoryValue = assignment.slotMode === "new" ? NEW_RECIPE_SLOT : normalizeCategory(recipe.category || assignment.category);
  const isMenuCreateFlow = options.mode === "create";
  const isNewRecipeFlow = isMenuCreateFlow && assignment.slotMode === "new";
  const selectedDayMenu = getDayMenu(options.menuData, assignment);
  const selectedMenuRecipeName = cleanMenuRecipeName(selectedDayMenu?.[resolveDayMenuCategory(selectedDayMenu, assignment.category)]);
  const form = createElement("form", "recipe-editor-form production-recipe-form");
  const header = createElement("div", "production-recipe-form__header");
  const fields = createElement("div", "production-recipe-form__grid");
  const actions = createElement("div", "admin-actions production-recipe-form__actions");
  const saveButton = createElement("button", "filter-button production-recipe-form__primary", options.mode === "create" ? "Save & Place on Menu" : "Save Changes");
  const resetButton = createElement("button", "filter-button", "Reset");
  const cancelButton = createElement("button", "filter-button", "Close");
  const deleteButton = createElement("button", "filter-button filter-button--danger", "Delete Recipe");

  header.append(
    createElement("h2", "", options.mode === "create" ? "New Production Recipe" : "Production Recipe"),
    createElement("p", "admin-muted", "Enter the recipe the way it appears on a prep sheet. The system will structure it for costing, inventory, and menu planning.")
  );

  const titleField = createInputField(
    "title",
    "Recipe Name",
    isMenuCreateFlow && !isNewRecipeFlow ? selectedMenuRecipeName || recipe.title : recipe.title,
    "Coffee-Rubbed Beef Tenderloin",
    { readOnly: isMenuCreateFlow && !isNewRecipeFlow }
  );
  const newSlotField = createSelectField("newCategory", "Slot", assignment.category, CATEGORY_OPTIONS);

  fields.append(
    createSelectField("week", "Week", assignment.week, WEEK_OPTIONS),
    createSelectField("day", "Day", assignment.day, DAY_OPTIONS),
    createSelectField("category", "Menu Slot", selectedCategoryValue, createMenuSlotOptions(options.menuData, assignment), { fallbackCategory: assignment.category }),
    titleField
  );

  if (isMenuCreateFlow) {
    newSlotField.hidden = !isNewRecipeFlow;
    fields.append(newSlotField);
  }

  fields.append(createInputField("yield", "Yield", recipe.yield, "24 servings"));

  form.append(
    header,
    fields,
    createRecipePhotoField(recipe, options),
    createTextareaField("ingredients", "Ingredients", formatIngredients(recipe.ingredients), "14 lb Beef chuck\n4 lb Mushrooms\n2 qt Red wine", 9),
    createTextareaField("steps", "Steps", formatSteps(recipe.steps), "1. Sear beef\n2. Add vegetables\n3. Simmer", 7)
  );

  saveButton.type = "submit";
  resetButton.type = "button";
  cancelButton.type = "button";
  deleteButton.type = "button";
  resetButton.addEventListener("click", options.onReset);
  cancelButton.addEventListener("click", options.onCancel);
  deleteButton.addEventListener("click", () => options.onDelete?.());
  actions.append(saveButton, resetButton);
  if (options.mode !== "create" && options.showDelete && typeof options.onDelete === "function") {
    deleteButton.disabled = options.deleteDisabled === true;
    actions.append(deleteButton);
  }
  actions.append(cancelButton);
  form.append(actions);

  const emitChange = () => {
    const next = readRecipeForm(form, recipe);
    options.onChange?.(next.recipe, next.assignment);
  };

  const titleInput = form.elements.namedItem("title");
  const weekSelect = form.elements.namedItem("week");
  const daySelect = form.elements.namedItem("day");
  const categorySelect = form.elements.namedItem("category");
  const newCategorySelect = form.elements.namedItem("newCategory");

  const syncSlotControls = () => {
    if (!categorySelect || !weekSelect || !daySelect) {
      return;
    }

    const isNewSlot = categorySelect.value === NEW_RECIPE_SLOT;
    const categoryValue = isNewSlot
      ? newCategorySelect?.value || categorySelect.dataset.fallbackCategory || assignment.category
      : categorySelect.value;
    const nextAssignment = {
      ...assignment,
      week: weekSelect.value,
      day: daySelect.value,
      category: normalizeCategory(categoryValue)
    };
    const selectedValue = isNewSlot ? NEW_RECIPE_SLOT : normalizeCategory(categoryValue);
    categorySelect.dataset.fallbackCategory = nextAssignment.category;
    replaceSelectOptions(categorySelect, createMenuSlotOptions(options.menuData, nextAssignment), selectedValue);

    if (newCategorySelect) {
      newCategorySelect.hidden = !isNewSlot;
      newCategorySelect.value = nextAssignment.category;
    }

    if (titleInput) {
      titleInput.readOnly = isMenuCreateFlow && !isNewSlot;
      if (isMenuCreateFlow && !isNewSlot) {
        const selectedOption = categorySelect.selectedOptions[0];
        titleInput.value = selectedOption?.dataset.recipeTitle || titleInput.value;
      }
    }
  };

  syncSlotControls();

  form.addEventListener("input", emitChange);
  form.addEventListener("change", (event) => {
    if (event.target === weekSelect || event.target === daySelect || event.target === categorySelect || event.target === newCategorySelect) {
      syncSlotControls();
    }
    emitChange();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = readRecipeForm(form, recipe);
    options.onSave?.(next.recipe, next.assignment);
  });

  container.replaceChildren(form);
}

export function readRecipeForm(form, baseRecipe = {}) {
  const formData = new FormData(form);
  const rawCategory = String(formData.get("category") || "");
  const categorySelect = form.elements.namedItem("category");
  const newCategory = String(formData.get("newCategory") || "");
  const category = rawCategory === NEW_RECIPE_SLOT
    ? normalizeCategory(newCategory || categorySelect?.dataset?.fallbackCategory || baseRecipe.category || "")
    : normalizeCategory(rawCategory);
  const recipe = {
    ...structuredClone(baseRecipe),
    title: String(formData.get("title") || "").trim(),
    yield: String(formData.get("yield") || "").trim(),
    category,
    photoUrl: String(formData.get("photoUrl") || "").trim(),
    ingredients: parseIngredients(String(formData.get("ingredients") || "")),
    steps: parseSteps(String(formData.get("steps") || ""))
  };

  delete recipe.tags;
  delete recipe.metadata;

  return {
    recipe,
    assignment: {
      mealType: "dinner",
      week: String(formData.get("week") || "Week 1"),
      day: String(formData.get("day") || "Monday"),
      category,
      slotMode: rawCategory === NEW_RECIPE_SLOT ? "new" : "existing"
    }
  };
}

function parseIngredients(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIngredientLine)
    .filter((ingredient) => ingredient.name || ingredient.unit || ingredient.amount !== 0);
}

function parseIngredientLine(line) {
  const pipeParts = line.split("|").map((part) => part.trim());

  if (pipeParts.length >= 3) {
    const [amount, unit, ...nameParts] = pipeParts;
    return {
      amount: parseIngredientAmount(amount),
      unit,
      name: nameParts.join(" | ")
    };
  }

  const parts = line.replace(/\s+/g, " ").split(" ");
  const amount = parseIngredientAmount(parts[0]);

  if (amount !== 0 && parts.length >= 3) {
    const unitCandidate = parts[1].toLowerCase();
    const hasKnownUnit = KNOWN_UNITS.has(unitCandidate);
    return {
      amount,
      unit: hasKnownUnit ? parts[1] : "",
      name: parts.slice(hasKnownUnit ? 2 : 1).join(" ")
    };
  }

  return {
    amount: 0,
    unit: "",
    name: line
  };
}

function parseIngredientAmount(value) {
  const text = String(value || "").trim();

  if (/^\d+\/\d+$/.test(text)) {
    const [top, bottom] = text.split("/").map(Number);
    return bottom ? top / bottom : 0;
  }

  const amount = Number(text);
  return Number.isFinite(amount) ? amount : 0;
}

function parseSteps(value) {
  return value
    .split("\n")
    .map((step) => step.replace(/^\s*\d+[\.)]\s*/, "").trim())
    .filter(Boolean);
}

export function renderValidation(container, result) {
  container.replaceChildren();

  if (!result) {
    container.append(createElement("p", "save-status save-status--neutral", "Missing Required Fields"));
    return;
  }

  if (result.ok) {
    container.append(createElement("p", "save-status save-status--success", "Ready to Save"));
    return;
  }

  const panel = createElement("section", "save-panel save-panel--error");
  panel.append(
    createElement("h3", "", "Missing Required Fields"),
    createElement("p", "admin-muted", (result.missing || []).join(", "))
  );
  container.append(panel);
}
