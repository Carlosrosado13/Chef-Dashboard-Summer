function parseFraction(value) {
  const fractionMatch = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);

  if (!fractionMatch) {
    return null;
  }

  const numerator = Number(fractionMatch[1]);
  const denominator = Number(fractionMatch[2]);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

export function parseQuantity(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  const mixedNumberMatch = trimmedValue.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?)$/);

  if (mixedNumberMatch) {
    const whole = Number(mixedNumberMatch[1]);
    const fraction = parseFraction(mixedNumberMatch[2]);
    return Number.isFinite(whole) && fraction !== null ? whole + fraction : null;
  }

  const fraction = parseFraction(trimmedValue);
  if (fraction !== null) {
    return fraction;
  }

  const number = Number(trimmedValue);
  return Number.isFinite(number) ? number : null;
}

export function parseYieldValue(yieldValue) {
  if (typeof yieldValue === "number") {
    return Number.isFinite(yieldValue) && yieldValue > 0 ? yieldValue : null;
  }

  const match = String(yieldValue || "").match(/(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)/);

  if (!match) {
    return null;
  }

  const parsedYield = parseQuantity(match[1]);
  return parsedYield && parsedYield > 0 ? parsedYield : null;
}

export function calculateScaleFactor(originalYield, targetYield) {
  const original = parseYieldValue(originalYield);
  const target = parseYieldValue(targetYield);

  if (!original || !target) {
    return null;
  }

  return target / original;
}

export function formatQuantity(quantity) {
  if (!Number.isFinite(quantity)) {
    return "";
  }

  const rounded = Math.round((quantity + Number.EPSILON) * 1000) / 1000;

  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(/0+$/, "").replace(/\.$/, "");
}

export function scaleIngredient(ingredient, scaleFactor) {
  const amount = parseQuantity(ingredient.amount);

  if (amount === null || !Number.isFinite(scaleFactor)) {
    return {
      ...ingredient,
      amount: ingredient.amount,
      scaled: false
    };
  }

  return {
    ...ingredient,
    amount: formatQuantity(amount * scaleFactor),
    scaled: true
  };
}

export function scaleRecipe(recipe, targetYield) {
  const scaleFactor = calculateScaleFactor(recipe.yield, targetYield);

  if (!scaleFactor) {
    return {
      ok: false,
      error: "Enter a valid target yield greater than zero.",
      recipe
    };
  }

  return {
    ok: true,
    scaleFactor,
    recipe: {
      ...recipe,
      yield: String(targetYield).trim(),
      ingredients: (recipe.ingredients || []).map((ingredient) => scaleIngredient(ingredient, scaleFactor))
    }
  };
}
