const CATEGORY_OPTIONS = [
  { label: "Appetizer 1", value: "Appetizer 1" },
  { label: "Appetizer 2", value: "Appetizer 2" },
  { label: "Elevated", value: "Elevated" },
  { label: "Traditional", value: "Traditional" },
  { label: "Alternative", value: "Alternative" },
  { label: "Veggie 1", value: "Veg 1" },
  { label: "Veggie 2", value: "Veg 2" },
  { label: "Starch", value: "Starch" },
  { label: "Dessert", value: "Dessert" }
];
const WEEK_OPTIONS = ["Week 1", "Week 2", "Week 3", "Week 4"];
const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
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

function createInputField(name, label, value, placeholder = "") {
  const wrapper = createElement("label", "admin-field");
  const labelText = createElement("span", "", label);
  const input = createElement("input", "");
  input.name = name;
  input.value = value || "";
  input.placeholder = placeholder;

  wrapper.append(labelText, input);
  return wrapper;
}

function createSelectField(name, label, value, options) {
  const wrapper = createElement("label", "admin-field");
  const select = createElement("select", "");
  select.name = name;

  for (const option of options) {
    const optionElement = createElement("option", "", option.label || option);
    optionElement.value = option.value || option;
    optionElement.selected = optionElement.value === value;
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
  if (value === "Veggie 1") {
    return "Veg 1";
  }

  if (value === "Veggie 2") {
    return "Veg 2";
  }

  return CATEGORY_OPTIONS.some((option) => option.value === value) ? value : "Elevated";
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
    week: options.assignment?.week || "Week 1",
    day: options.assignment?.day || "Monday",
    category: normalizeCategory(options.assignment?.category || recipe.category)
  };
  const form = createElement("form", "recipe-editor-form production-recipe-form");
  const header = createElement("div", "production-recipe-form__header");
  const fields = createElement("div", "production-recipe-form__grid");
  const actions = createElement("div", "admin-actions production-recipe-form__actions");
  const saveButton = createElement("button", "filter-button production-recipe-form__primary", options.mode === "create" ? "Save & Place on Menu" : "Save Changes");
  const resetButton = createElement("button", "filter-button", "Reset");
  const cancelButton = createElement("button", "filter-button", "Close");

  header.append(
    createElement("h2", "", options.mode === "create" ? "New Production Recipe" : "Production Recipe"),
    createElement("p", "admin-muted", "Enter the recipe the way it appears on a prep sheet. The system will structure it for costing, inventory, and menu planning.")
  );

  fields.append(
    createInputField("title", "Recipe Name", recipe.title, "Coffee-Rubbed Beef Tenderloin"),
    createSelectField("category", "Recipe Category", normalizeCategory(recipe.category || assignment.category), CATEGORY_OPTIONS),
    createSelectField("week", "Week", assignment.week, WEEK_OPTIONS),
    createSelectField("day", "Day", assignment.day, DAY_OPTIONS),
    createInputField("yield", "Yield", recipe.yield, "24 servings")
  );

  form.append(
    header,
    fields,
    createTextareaField("ingredients", "Ingredients", formatIngredients(recipe.ingredients), "14 lb Beef chuck\n4 lb Mushrooms\n2 qt Red wine", 9),
    createTextareaField("steps", "Steps", formatSteps(recipe.steps), "1. Sear beef\n2. Add vegetables\n3. Simmer", 7)
  );

  saveButton.type = "submit";
  resetButton.type = "button";
  cancelButton.type = "button";
  resetButton.addEventListener("click", options.onReset);
  cancelButton.addEventListener("click", options.onCancel);
  actions.append(saveButton, resetButton, cancelButton);
  form.append(actions);

  const emitChange = () => {
    const next = readRecipeForm(form, recipe);
    options.onChange?.(next.recipe, next.assignment);
  };

  form.addEventListener("input", emitChange);
  form.addEventListener("change", emitChange);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = readRecipeForm(form, recipe);
    options.onSave?.(next.recipe, next.assignment);
  });

  container.replaceChildren(form);
}

export function readRecipeForm(form, baseRecipe = {}) {
  const formData = new FormData(form);
  const category = normalizeCategory(String(formData.get("category") || ""));
  const recipe = {
    ...structuredClone(baseRecipe),
    title: String(formData.get("title") || "").trim(),
    yield: String(formData.get("yield") || "").trim(),
    category,
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
      category
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
    container.append(createElement("p", "admin-muted", "Recipe check will appear here."));
    return;
  }

  if (result.ok) {
    container.append(createElement("p", "admin-valid", "Ready to save."));
    return;
  }

  const list = createElement("ul", "admin-errors");
  for (const error of result.errors) {
    list.append(createElement("li", "", error.message));
  }
  container.append(list);
}
