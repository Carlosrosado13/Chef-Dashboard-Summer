export const UNIT_MAP = {
  tbsp: "tablespoon",
  tablespoon: "tablespoon",
  tablespoons: "tablespoon",
  tsp: "teaspoon",
  teaspoon: "teaspoon",
  teaspoons: "teaspoon",
  oz: "ounce",
  ounce: "ounce",
  ounces: "ounce",
  lb: "pound",
  lbs: "pound",
  pound: "pound",
  pounds: "pound"
};

export function normalizeUnit(unit) {
  if (typeof unit !== "string") {
    return "";
  }

  const normalizedUnit = unit.trim().toLowerCase();

  return UNIT_MAP[normalizedUnit] || normalizedUnit;
}
