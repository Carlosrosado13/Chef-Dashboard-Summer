import { scaleRecipe } from "./scaleRecipe.js";

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

function renderIngredients(ingredients) {
  const list = createElement("ul", "recipe-modal__ingredients");

  for (const ingredient of ingredients || []) {
    const item = createElement(
      "li",
      "",
      `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`.trim()
    );
    list.append(item);
  }

  return list;
}

function renderSteps(steps) {
  const list = createElement("ol", "recipe-modal__steps");

  for (const step of steps || []) {
    list.append(createElement("li", "", step));
  }

  return list;
}

export function createRecipeModal() {
  const modal = createElement("div", "recipe-modal");
  modal.hidden = true;

  const backdrop = createElement("button", "recipe-modal__backdrop");
  backdrop.type = "button";
  backdrop.setAttribute("aria-label", "Close recipe");

  const panel = createElement("section", "recipe-modal__panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  const closeButton = createElement("button", "recipe-modal__close", "Close");
  closeButton.type = "button";

  const body = createElement("div", "recipe-modal__body");
  panel.append(closeButton, body);
  modal.append(backdrop, panel);

  function close() {
    modal.hidden = true;
    document.body.classList.remove("has-open-modal");
  }

  function open() {
    modal.hidden = false;
    document.body.classList.add("has-open-modal");
    closeButton.focus();
  }

  backdrop.addEventListener("click", close);
  closeButton.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      close();
    }
  });

  return {
    element: modal,
    openRecipe(recipe) {
      body.replaceChildren(renderRecipe(recipe, recipe));
      open();
    },
    openMissingRecipe(title) {
      body.replaceChildren(renderMissingRecipe(title));
      open();
    },
    close
  };
}

function renderRecipe(recipe, originalRecipe) {
  const content = createElement("article", "recipe-modal__content");
  const title = createElement("h2", "recipe-modal__title", recipe.title);
  const meta = createElement("p", "recipe-modal__meta", `${recipe.category} | Original yield: ${originalRecipe.yield}`);
  const scaler = renderYieldScaler(recipe, originalRecipe, content);

  const ingredientsTitle = createElement("h3", "", "Ingredients");
  const ingredientsWrap = createElement("div", "recipe-modal__ingredients-wrap");
  ingredientsWrap.append(renderIngredients(recipe.ingredients));
  const stepsTitle = createElement("h3", "", "Steps");

  content.append(
    title,
    meta,
    scaler,
    ingredientsTitle,
    ingredientsWrap,
    stepsTitle,
    renderSteps(recipe.steps)
  );

  return content;
}

function renderYieldScaler(recipe, originalRecipe, content) {
  const form = createElement("form", "recipe-scaler");
  const label = createElement("label", "recipe-scaler__label", "Target yield");
  const input = createElement("input", "recipe-scaler__input");
  const scaleButton = createElement("button", "recipe-scaler__button", "Scale");
  const resetButton = createElement("button", "recipe-scaler__button", "Reset");
  const message = createElement("p", "recipe-scaler__message", `Current yield: ${recipe.yield}`);

  input.type = "text";
  input.value = recipe.yield;
  input.placeholder = "Example: 48 servings";
  scaleButton.type = "submit";
  resetButton.type = "button";

  label.append(input);
  form.append(label, scaleButton, resetButton, message);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = scaleRecipe(originalRecipe, input.value);

    if (!result.ok) {
      message.textContent = result.error;
      message.dataset.tone = "error";
      return;
    }

    updateScaledIngredients(content, result.recipe.ingredients);
    message.textContent = `Current yield: ${result.recipe.yield} | Scale factor: ${result.scaleFactor.toFixed(2)}`;
    message.dataset.tone = "success";
  });

  resetButton.addEventListener("click", () => {
    input.value = originalRecipe.yield;
    updateScaledIngredients(content, originalRecipe.ingredients);
    message.textContent = `Current yield: ${originalRecipe.yield}`;
    message.dataset.tone = "neutral";
  });

  return form;
}

function updateScaledIngredients(content, ingredients) {
  const ingredientsWrap = content.querySelector(".recipe-modal__ingredients-wrap");

  if (ingredientsWrap) {
    ingredientsWrap.replaceChildren(renderIngredients(ingredients));
  }
}

function renderMissingRecipe(title) {
  const content = createElement("article", "recipe-modal__content");
  content.append(
    createElement("h2", "recipe-modal__title", "Recipe not linked yet."),
    createElement("p", "recipe-modal__meta", title),
    createElement("p", "", "Recipe not linked yet.")
  );

  return content;
}
