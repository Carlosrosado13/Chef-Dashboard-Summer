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
      body.replaceChildren(renderRecipe(recipe));
      open();
    },
    openMissingRecipe(title) {
      body.replaceChildren(renderMissingRecipe(title));
      open();
    },
    close
  };
}

function renderRecipe(recipe) {
  const content = createElement("article", "recipe-modal__content");
  const title = createElement("h2", "recipe-modal__title", recipe.title);
  const meta = createElement("p", "recipe-modal__meta", `${recipe.category} | Yield: ${recipe.yield}`);

  const ingredientsTitle = createElement("h3", "", "Ingredients");
  const stepsTitle = createElement("h3", "", "Steps");

  content.append(
    title,
    meta,
    ingredientsTitle,
    renderIngredients(recipe.ingredients),
    stepsTitle,
    renderSteps(recipe.steps)
  );

  return content;
}

function renderMissingRecipe(title) {
  const content = createElement("article", "recipe-modal__content");
  content.append(
    createElement("h2", "recipe-modal__title", "Recipe not found"),
    createElement("p", "recipe-modal__meta", title),
    createElement("p", "", "No linked recipe is available for this menu item yet.")
  );

  return content;
}
