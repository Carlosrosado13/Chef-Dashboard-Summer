import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  createRecipeId,
  findRecipeByTitle,
  normalizeRecipeTitle,
} from "../js/loadRecipes.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");
const workbookArgument = process.argv.find((argument) => argument.toLowerCase().endsWith(".xlsx"));
const workbookPath = path.resolve(
  workbookArgument || "C:/Users/cjr_1/Downloads/lunch-menu-master.xlsx",
);
const menuPath = path.join(root, "data", "processed", "clean-menu.json");
const recipesPath = path.join(root, "data", "recipes", "sample-recipes.json");
const reportPath = path.join(root, "lunch-menu-update-report.md");

const readJson = async (file) =>
  JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/, ""));
const readHeadJson = (file) =>
  JSON.parse(execFileSync("git", ["show", `HEAD:${file}`], {
    cwd: root,
    encoding: "utf8",
  }));

function extractWorkbookRows() {
  const output = execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(root, "scripts", "extract-lunch-menu-master.ps1"),
      "-WorkbookPath",
      workbookPath,
    ],
    { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  const parsed = JSON.parse(output.replace(/^\uFEFF/, ""));
  return Array.isArray(parsed) ? parsed : [parsed];
}

function references(rotation) {
  const rows = [];
  for (const [week, weekValue] of Object.entries(rotation?.weeks || {})) {
    for (const [day, dayValue] of Object.entries(weekValue?.days || {})) {
      for (const [category, title] of Object.entries(dayValue || {})) {
        rows.push({ week, day, category, title: String(title || "").trim() });
      }
    }
  }
  return rows;
}

function normalizeWeek(value) {
  const match = String(value || "").match(/(\d+)/);
  return match ? `Week ${match[1]}` : String(value || "").trim();
}

const categoryMap = new Map([
  ["soup 1", "Soup 1"],
  ["entree 1", "Entrée 1"],
  ["entree 2", "Entrée 2"],
  ["salad", "Salad"],
  ["dessert", "Dessert"],
]);

function normalizeCategory(value) {
  const key = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return categoryMap.get(key) || "";
}

function isPlaceholder(recipe) {
  return Boolean(
    recipe?.metadata?.createdForMenuLinkAudit
    || recipe?.tags?.includes("placeholder")
    || recipe?.ingredients?.some((ingredient) =>
      /recipe details pending/i.test(String(ingredient?.name || "")))
    || recipe?.steps?.some((step) =>
      /placeholder recipe created/i.test(String(step || ""))),
  );
}

function hasIngredients(recipe) {
  return Array.isArray(recipe?.ingredients)
    && recipe.ingredients.length > 0
    && !isPlaceholder(recipe);
}

function hasInstructions(recipe) {
  return Array.isArray(recipe?.steps)
    && recipe.steps.some((step) => String(step || "").trim())
    && !isPlaceholder(recipe);
}

function addAlias(recipe, alias) {
  const aliases = new Set(
    Array.isArray(recipe.aliases)
      ? recipe.aliases.map((value) => String(value || "").trim()).filter(Boolean)
      : [],
  );
  aliases.add(alias);
  recipe.aliases = [...aliases];
}

function markdownTable(rows) {
  const lines = [
    "| Week | Day | Category | Recipe |",
    "| --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    lines.push(
      `| ${row.week} | ${row.day} | ${row.category} | ${row.title.replaceAll("|", "\\|")} |`,
    );
  }
  return lines.join("\n");
}

const sourceRows = extractWorkbookRows().map((row) => ({
  sourceRow: row.Row,
  week: normalizeWeek(row.Week),
  day: String(row.Day || "").trim(),
  category: normalizeCategory(row.Category),
  title: String(row.MenuItem || "").trim(),
  recipeAssignment: String(row.RecipeAssignment || "").trim(),
  servings: String(row.Servings || "").trim(),
}));

const menu = await readJson(menuPath);
const recipes = await readJson(recipesPath);
const baselineMenu = readHeadJson("data/processed/clean-menu.json");
const baselineRecipes = readHeadJson("data/recipes/sample-recipes.json");
const originalDinner = JSON.stringify(menu.dinner);
const beforeRows = references(baselineMenu.lunch);
const proposedMenu = structuredClone(menu);
const proposedRecipes = structuredClone(recipes);

for (let index = 0; index < proposedRecipes.length; index++) {
  const baselineAliases = baselineRecipes[index]?.aliases;
  if (Array.isArray(baselineAliases) && baselineAliases.length) {
    proposedRecipes[index].aliases = structuredClone(baselineAliases);
  } else {
    delete proposedRecipes[index].aliases;
  }
}

const expectedWeeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
const expectedDays = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
const expectedCategories = ["Soup 1", "Entrée 1", "Entrée 2", "Salad", "Dessert"];
const validSlots = new Set(
  expectedWeeks.flatMap((week) =>
    expectedDays.flatMap((day) =>
      expectedCategories.map((category) => `${week}\u001f${day}\u001f${category}`),
    ),
  ),
);

const invalidRows = sourceRows.filter((row) =>
  !validSlots.has(`${row.week}\u001f${row.day}\u001f${row.category}`)
  || !row.title
);
const duplicateSlots = Object.values(
  Object.groupBy(
    sourceRows,
    (row) => `${row.week}\u001f${row.day}\u001f${row.category}`,
  ),
).filter((rows) => rows.length > 1);
const missingSlots = [...validSlots].filter((slot) =>
  !sourceRows.some((row) =>
    `${row.week}\u001f${row.day}\u001f${row.category}` === slot
  ),
);

const resolutions = [];
const missingRecipes = [];
for (const row of sourceRows) {
  let recipe = findRecipeByTitle(proposedRecipes, row.title);
  let resolution = "Existing exact recipe";

  if (!recipe) {
    const currentTitle =
      baselineMenu.lunch?.weeks?.[row.week]?.days?.[row.day]?.[row.category] || "";
    recipe = findRecipeByTitle(proposedRecipes, currentTitle);
    if (recipe) {
      addAlias(recipe, row.title);
      resolution = `Existing slot recipe reused; alias added (${recipe.title})`;
    }
  }

  if (!recipe) {
    missingRecipes.push(row);
    resolutions.push({ ...row, resolution: "Missing from recipe database" });
    continue;
  }

  proposedMenu.lunch.weeks[row.week].days[row.day][row.category] = row.title;
  resolutions.push({
    ...row,
    recipeTitle: recipe.title,
    recipeId: recipe.id || recipe.recipeId || createRecipeId(recipe.title),
    resolution,
  });
}

const afterRows = references(proposedMenu.lunch);
const brokenLinks = afterRows.filter((row) =>
  !findRecipeByTitle(proposedRecipes, row.title)
);
const duplicateRecipeRecords = Object.values(
  Object.groupBy(proposedRecipes, (recipe) => normalizeRecipeTitle(recipe.title)),
).filter((group) => group.length > 1);
const emptySlots = afterRows.filter((row) => !row.title);
const invalidAssignments = [
  ...invalidRows,
  ...afterRows.filter((row) =>
    !validSlots.has(`${row.week}\u001f${row.day}\u001f${row.category}`)
  ),
];

const linkedRecipes = new Map();
for (const row of afterRows) {
  const recipe = findRecipeByTitle(proposedRecipes, row.title);
  if (recipe) linkedRecipes.set(normalizeRecipeTitle(recipe.title), recipe);
}
const recipesRequiringRebuild = [...linkedRecipes.values()]
  .filter(isPlaceholder)
  .map((recipe) => recipe.title)
  .sort();
const missingIngredients = [...linkedRecipes.values()]
  .filter((recipe) => !hasIngredients(recipe))
  .map((recipe) => recipe.title)
  .sort();
const missingInstructions = [...linkedRecipes.values()]
  .filter((recipe) => !hasInstructions(recipe))
  .map((recipe) => recipe.title)
  .sort();

const dinnerUnchanged = JSON.stringify(proposedMenu.dinner) === originalDinner;
const coreValidationPassed =
  sourceRows.length === 140
  && invalidRows.length === 0
  && duplicateSlots.length === 0
  && missingSlots.length === 0
  && missingRecipes.length === 0
  && brokenLinks.length === 0
  && emptySlots.length === 0
  && invalidAssignments.length === 0
  && duplicateRecipeRecords.length === 0
  && dinnerUnchanged;

const list = (items) =>
  items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
const generatedAt = new Date().toISOString();
const report = `# Lunch Menu Update Report

Generated: ${generatedAt}

Source of truth: \`${workbookPath}\`

Scope: Lunch only. Dinner assignments and recipe content were preserved.

## BEFORE

${markdownTable(beforeRows)}

## AFTER

${markdownTable(afterRows)}

## VALIDATION RESULTS

| Check | Result | Count |
| --- | --- | ---: |
| Source assignments | ${sourceRows.length === 140 ? "PASS" : "FAIL"} | ${sourceRows.length} |
| Missing recipes | ${missingRecipes.length === 0 ? "PASS" : "FAIL"} | ${missingRecipes.length} |
| Broken recipe links | ${brokenLinks.length === 0 ? "PASS" : "FAIL"} | ${brokenLinks.length} |
| Invalid menu assignments | ${invalidAssignments.length === 0 ? "PASS" : "FAIL"} | ${invalidAssignments.length} |
| Duplicate assignments | ${duplicateSlots.length === 0 ? "PASS" : "FAIL"} | ${duplicateSlots.length} |
| Duplicate recipe records | ${duplicateRecipeRecords.length === 0 ? "PASS" : "FAIL"} | ${duplicateRecipeRecords.length} |
| Empty menu slots | ${emptySlots.length === 0 && missingSlots.length === 0 ? "PASS" : "FAIL"} | ${emptySlots.length + missingSlots.length} |
| Dinner unchanged | ${dinnerUnchanged ? "PASS" : "FAIL"} | ${dinnerUnchanged ? 0 : 1} |

Core Lunch validation: **${coreValidationPassed ? "PASS" : "FAIL"}**

## RECIPE AUDIT

### Recipes Missing From Database

${list(missingRecipes.map((row) => `${row.week} / ${row.day} / ${row.category}: ${row.title}`))}

### Recipes Requiring Rebuild

${list(recipesRequiringRebuild)}

### Recipes With Missing Ingredients

${list(missingIngredients)}

### Recipes With Missing Instructions

${list(missingInstructions)}

## RECIPE RESOLUTION

| Week | Day | Category | Spreadsheet Recipe | Existing Recipe Record | Resolution |
| --- | --- | --- | --- | --- | --- |
${resolutions.map((row) =>
  `| ${row.week} | ${row.day} | ${row.category} | ${row.title.replaceAll("|", "\\|")} | ${(row.recipeTitle || "").replaceAll("|", "\\|")} | ${row.resolution.replaceAll("|", "\\|")} |`
).join("\n")}

## DEPLOYMENT STATUS

- Commit completed: Pending
- Push completed: Pending
- Live verification completed: Pending
`;

await fs.writeFile(reportPath, report, "utf8");

if (apply) {
  if (!coreValidationPassed) {
    throw new Error("Lunch update was not applied because core validation failed.");
  }
  await fs.writeFile(menuPath, `${JSON.stringify(proposedMenu, null, 2)}\n`, "utf8");
  await fs.writeFile(recipesPath, `${JSON.stringify(proposedRecipes, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({
  applied: apply,
  sourceAssignments: sourceRows.length,
  changedAssignments: afterRows.filter((row, index) => row.title !== beforeRows[index]?.title).length,
  aliasesAdded: resolutions.filter((row) => row.resolution.includes("alias added")).length,
  missingRecipes: missingRecipes.length,
  brokenLinks: brokenLinks.length,
  invalidAssignments: invalidAssignments.length,
  duplicateAssignments: duplicateSlots.length,
  duplicateRecipeRecords: duplicateRecipeRecords.length,
  emptySlots: emptySlots.length + missingSlots.length,
  recipesRequiringRebuild: recipesRequiringRebuild.length,
  missingIngredients: missingIngredients.length,
  missingInstructions: missingInstructions.length,
  dinnerUnchanged,
  coreValidationPassed,
}, null, 2));
