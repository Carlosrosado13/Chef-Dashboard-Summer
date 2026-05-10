const EMPTY_VALUE = "";

const LUNCH_CATEGORY_MAP = {
  soup: "SOUP",
  salad: "SALAD",
  "main 1": "MAIN 1",
  main1: "MAIN 1",
  "main one": "MAIN 1",
  "main 2": "MAIN 2",
  main2: "MAIN 2",
  "main two": "MAIN 2",
  dessert: "DESSERT"
};

const DINNER_CATEGORY_MAP = {
  "appetizer 1": "Appetizer 1",
  appetizer1: "Appetizer 1",
  "app one": "Appetizer 1",
  "app 1": "Appetizer 1",
  "appetizer 2": "Appetizer 2",
  appetizer2: "Appetizer 2",
  "app two": "Appetizer 2",
  "app 2": "Appetizer 2",
  elevated: "Elevated",
  comfort: "Comfort",
  traditional: "Comfort",
  alternative: "Alternative",
  "veg 1": "Veggie 1",
  veg1: "Veggie 1",
  "veggie 1": "Veggie 1",
  veggie1: "Veggie 1",
  "vegetable 1": "Veggie 1",
  "veg 2": "Veggie 2",
  veg2: "Veggie 2",
  "veggie 2": "Veggie 2",
  veggie2: "Veggie 2",
  "vegetable 2": "Veggie 2",
  starch: "Starch",
  dessert: "Dessert"
};

const MOJIBAKE_REPLACEMENTS = {
  "â€™": "'",
  "â€˜": "'",
  "â€œ": "\"",
  "â€�": "\"",
  "â€“": "-",
  "â€”": "-",
  "Â": ""
};

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeText(value) {
  if (value === undefined || value === null) {
    return EMPTY_VALUE;
  }

  let text = String(value).normalize("NFKC");

  for (const [badValue, replacement] of Object.entries(MOJIBAKE_REPLACEMENTS)) {
    text = text.replaceAll(badValue, replacement);
  }

  text = text
    .replace(/\u00a0/g, " ")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(n\/?a|none|null|undefined|-|--|)$/i.test(text)) {
    return EMPTY_VALUE;
  }

  return text;
}

export function normalizeWeekName(weekName) {
  const text = normalizeText(weekName);
  const weekNumberMatch = text.match(/^(?:week\s*)?(\d+)$/i);

  if (weekNumberMatch) {
    return `Week ${weekNumberMatch[1]}`;
  }

  return text.replace(/^week\b/i, "Week");
}

function normalizeDayName(dayName) {
  const text = normalizeText(dayName);

  return text
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeCategoryKey(category, mealType) {
  const text = normalizeText(category);
  const lookupKey = text.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const compactKey = lookupKey.replace(/\s+/g, "");
  const categoryMap = mealType === "lunch" ? LUNCH_CATEGORY_MAP : DINNER_CATEGORY_MAP;

  return categoryMap[lookupKey] || categoryMap[compactKey] || text;
}

function getWeeksSource(rotation) {
  if (!isRecord(rotation)) {
    return {};
  }

  return isRecord(rotation.weeks) ? rotation.weeks : rotation;
}

function getDaysSource(week) {
  if (!isRecord(week)) {
    return {};
  }

  return isRecord(week.days) ? week.days : week;
}

function normalizeDay(day, mealType) {
  const normalizedDay = {};

  if (!isRecord(day)) {
    return normalizedDay;
  }

  for (const [category, value] of Object.entries(day)) {
    const normalizedCategory = normalizeCategoryKey(category, mealType);
    normalizedDay[normalizedCategory] = normalizeText(value);
  }

  return normalizedDay;
}

function normalizeMealRotation(rotation, mealType) {
  const normalizedWeeks = {};

  for (const [weekName, week] of Object.entries(getWeeksSource(rotation))) {
    const normalizedDays = {};

    for (const [dayName, day] of Object.entries(getDaysSource(week))) {
      normalizedDays[normalizeDayName(dayName)] = normalizeDay(day, mealType);
    }

    normalizedWeeks[normalizeWeekName(weekName)] = {
      days: normalizedDays
    };
  }

  return {
    weeks: normalizedWeeks
  };
}

export function normalizeMenuRotation(menuRotation) {
  const normalizedRotation = {};

  if (!isRecord(menuRotation)) {
    return normalizedRotation;
  }

  if (isRecord(menuRotation.lunch)) {
    normalizedRotation.lunch = normalizeMealRotation(menuRotation.lunch, "lunch");
  }

  if (isRecord(menuRotation.dinner)) {
    normalizedRotation.dinner = normalizeMealRotation(menuRotation.dinner, "dinner");
  }

  return normalizedRotation;
}

export { EMPTY_VALUE, LUNCH_CATEGORY_MAP, DINNER_CATEGORY_MAP };
