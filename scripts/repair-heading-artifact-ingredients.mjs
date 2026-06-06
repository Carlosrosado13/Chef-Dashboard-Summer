import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipesPath = path.join(root, "data", "recipes", "sample-recipes.json");
const auditPath = path.join(root, ".tmp-remaining-artifact-report.json");
const recipes = JSON.parse((await fs.readFile(recipesPath, "utf8")).replace(/^\uFEFF/, ""));
let previousAudit = null;
try {
  previousAudit = JSON.parse(await fs.readFile(auditPath, "utf8"));
} catch {
  previousAudit = null;
}

const normalize = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9&]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();

const sourceUrl = (recipe) => String(
  recipe?.metadata?.sourceUrl
  || recipe?.metadata?.recipeUrl
  || recipe?.metadata?.importedFromUrl
  || recipe?.sourceUrl
  || recipe?.recipeUrl
  || recipe?.importedFromUrl
  || ""
).trim().replace(/\s+\(.*$/s, "");

const headingWords = new Set(`
the base seasoning melba poaching liquid liquids aromatic aromatics herb herbs coating sauce citrus crunch
glaze vegetable vegetables protein filling fillings meat beef cheese bread topping toppings spice spices
salad steam dressing batter fruit garnish marinade assembly finish finishing brightener sweetener
`.trim().split(/\s+/));

const foodWords = new Set(`
agar almond anchovy apple apricot arugula asparagus avocado bacon basil bean beans beef beet berries berry
broccoli broth butter cabbage caper carrot carrots cauliflower celery cheese chicken chickpea chili chocolate
cilantro cinnamon clams coconut cod corn cream cucumber cumin dill egg eggs fennel fish flour garlic ginger
grape ham honey kale lamb leek lemon lentil lettuce lime lobster mango maple milk mint mushroom mustard oats
oil olive onion orange oregano parsley pasta peach peaches pear peas pepper pesto pork potato prosciutto quinoa
radish rice ricotta rosemary salmon salt scallop shallot shrimp spinach squash stock strawberry sugar thyme
tomato tomatoes tuna turkey vanilla vinegar walnut water wine yogurt zucchini
`.trim().split(/\s+/));

const embeddedQuantity = /(?:^|[a-z),])(?:the\s+)?(?:base|seasoning|melba|poaching|liquid|aromatics|brightener|sweetener|dressing|sauce|spices?|fillings?|toppings?|cheese|bread|cake\s+batter|flavor\s+builders?|herbs?|vegetables?|pasta)\s*(?:&\s*[a-z ]+)?\s*:?\s*\d/i;

function displayIngredient(ingredient) {
  return [ingredient?.amount, ingredient?.unit, ingredient?.name]
    .filter((value) => value !== "" && value !== undefined && value !== null)
    .join(" ");
}

function artifactReason(recipe, ingredient) {
  const name = String(ingredient?.name || "").trim();
  const words = normalize(name).split(" ").filter(Boolean);
  const oneEach = Number(ingredient?.amount) === 1 && normalize(ingredient?.unit) === "each";
  const hasFoodWord = words.some((word) => foodWords.has(word));
  const title = normalize(recipe?.title);
  const normalized = normalize(name);

  if (!name) return "Missing ingredient name";
  if (/[&+:]\s*$/.test(name)) return "Truncated section heading";
  if (/^(?:the|and|or)$/i.test(name)) return "Section-heading fragment";
  if (embeddedQuantity.test(name)) return "Multiple ingredients collapsed into one field";
  if (oneEach && words.length === 1 && headingWords.has(words[0]) && !hasFoodWord) {
    return "Single-word section heading";
  }
  if (oneEach && /^(?:the\s+)?(?:base|seasoning|melba|poaching|liquid|aromatics)(?:\s+&.*)?$/i.test(name)) {
    return "Section title extracted as ingredient";
  }
  if (oneEach && normalized === title) return "Recipe title extracted as ingredient";
  if (oneEach && words.length <= 5 && words.length >= 2 && title.includes(normalized) && !hasFoodWord) {
    return "Recipe-title fragment extracted as ingredient";
  }
  return "";
}

const ingredient = (amount, unit, name) => ({ amount, unit, name });

const rebuilt = new Map([
  ["SAUTEED SHRIMP WITH GARLIC, WHITE WINE & FRESH DICED TOMATO", [
    ingredient(3, "Tbsp", "olive oil, plus more for drizzling"),
    ingredient(4, "clove", "garlic, thinly sliced"),
    ingredient(2, "each", "medium shallots, thinly sliced"),
    ingredient(1, "pint", "grape tomatoes, halved lengthwise"),
    ingredient(1, "lb", "large shrimp, peeled and deveined with tails left on"),
    ingredient(0.5, "tsp", "dried red pepper flakes"),
    ingredient(2, "tsp", "fresh thyme leaves"),
    ingredient(1, "cup", "dry white wine"),
    ingredient(1, "tsp", "kosher salt, or to taste"),
    ingredient(0.5, "tsp", "ground black pepper, or to taste")
  ]],
  ["PASTA WITH SUMMER VEGETABLES WITH LEMON PARMESAN SAUCE", [
    ingredient(8, "oz", "short pasta, such as penne, bowties, or rotini"),
    ingredient(1, "Tbsp", "olive oil"),
    ingredient(1, "each", "medium zucchini, sliced into half-moons"),
    ingredient(1, "each", "medium yellow squash, sliced into half-moons"),
    ingredient(1, "cup", "cherry tomatoes, halved"),
    ingredient(1, "cup", "fresh or frozen peas"),
    ingredient(3, "clove", "garlic, minced"),
    ingredient(2, "Tbsp", "unsalted butter"),
    ingredient(1, "each", "large lemon, zested and juiced"),
    ingredient(0.5, "cup", "Parmesan cheese, grated"),
    ingredient(0.5, "cup", "reserved pasta cooking water"),
    ingredient(0.25, "cup", "fresh basil leaves, chopped or torn"),
    ingredient(1, "tsp", "kosher salt, or to taste"),
    ingredient(0.5, "tsp", "ground black pepper"),
    ingredient(0.125, "tsp", "crushed red pepper flakes, optional")
  ]],
  ["LEMON SORBET", [
    ingredient(6, "cup", "freshly squeezed lemon juice"),
    ingredient(1, "cup", "granulated sugar"),
    ingredient(6, "cup", "water"),
    ingredient(1, "Tbsp", "finely grated lemon zest")
  ]],
  ["CHICKEN TORTILLA", [
    ingredient(4, "Tbsp", "olive oil"),
    ingredient(4, "each", "yellow onions, diced"),
    ingredient(4, "each", "jalapeno peppers, seeded and minced"),
    ingredient(12, "clove", "garlic, minced"),
    ingredient(1, "tsp", "ground cumin"),
    ingredient(4, "tsp", "chili powder"),
    ingredient(4, "tsp", "dried oregano"),
    ingredient(2, "tsp", "kosher salt"),
    ingredient(4, "cup", "low-sodium chicken broth"),
    ingredient(4, "can", "14 oz crushed tomatoes"),
    ingredient(3, "cup", "cooked chicken, shredded"),
    ingredient(4, "can", "black beans, drained and rinsed"),
    ingredient(4, "cup", "corn kernels"),
    ingredient(2, "Tbsp", "fresh lime or lemon juice"),
    ingredient(1, "cup", "tortilla chips, crushed"),
    ingredient(4, "each", "avocados, diced"),
    ingredient(2, "cup", "shredded cheese"),
    ingredient(1, "cup", "fresh cilantro, chopped")
  ]],
  ["GRILLED FISH WITH SALSA", [
    ingredient(24, "each", "fish fillets, 4 to 5 oz each"),
    ingredient(6, "Tbsp", "olive oil, divided"),
    ingredient(3, "tsp", "chili powder"),
    ingredient(3, "tsp", "garlic powder"),
    ingredient(1.5, "tsp", "ground cumin"),
    ingredient(2, "tsp", "kosher salt"),
    ingredient(1, "tsp", "ground black pepper"),
    ingredient(6, "cup", "diced ripe mango or tomato"),
    ingredient(3, "cup", "diced red bell pepper"),
    ingredient(1.5, "cup", "finely diced red onion"),
    ingredient(1.5, "cup", "fresh cilantro, chopped"),
    ingredient(6, "each", "jalapeno peppers, seeded and minced"),
    ingredient(0.75, "cup", "fresh lime juice")
  ]],
  ["TOMATO BASIL", [
    ingredient(12, "can", "14 oz diced tomatoes"),
    ingredient(12, "Tbsp", "unsalted butter"),
    ingredient(6, "Tbsp", "olive oil"),
    ingredient(6, "each", "yellow onions, diced"),
    ingredient(24, "clove", "garlic, minced"),
    ingredient(12, "cup", "low-sodium vegetable broth"),
    ingredient(3, "cup", "heavy cream"),
    ingredient(3, "cup", "fresh basil leaves"),
    ingredient(6, "Tbsp", "granulated sugar"),
    ingredient(3, "tsp", "sea salt"),
    ingredient(1.5, "tsp", "ground black pepper")
  ]],
  ["PHILLY CHEESESTEAK", [
    ingredient(9, "lb", "ribeye steak, thinly sliced"),
    ingredient(6, "each", "large yellow onions, thinly sliced"),
    ingredient(6, "each", "green bell peppers, thinly sliced"),
    ingredient(48, "slice", "provolone cheese"),
    ingredient(24, "each", "hoagie rolls"),
    ingredient(6, "Tbsp", "vegetable oil"),
    ingredient(3, "tsp", "garlic powder"),
    ingredient(2, "tsp", "kosher salt"),
    ingredient(1, "tsp", "ground black pepper")
  ]],
  ["CHICKPEA & VEGETABLE CURRY", [
    ingredient(12, "can", "15 oz chickpeas, drained and rinsed"),
    ingredient(6, "can", "14 oz coconut milk"),
    ingredient(6, "can", "14 oz diced tomatoes"),
    ingredient(6, "Tbsp", "coconut or vegetable oil"),
    ingredient(6, "each", "yellow onions, diced"),
    ingredient(18, "clove", "garlic, minced"),
    ingredient(6, "Tbsp", "fresh ginger, minced"),
    ingredient(9, "Tbsp", "curry powder"),
    ingredient(6, "tsp", "ground cumin"),
    ingredient(3, "tsp", "ground turmeric"),
    ingredient(3, "tsp", "kosher salt"),
    ingredient(6, "each", "sweet potatoes, peeled and diced"),
    ingredient(6, "each", "red bell peppers, diced"),
    ingredient(12, "cup", "baby spinach"),
    ingredient(6, "Tbsp", "fresh lime juice"),
    ingredient(1.5, "cup", "fresh cilantro, chopped")
  ]],
  ["PINEAPPLE CAKE WITH CITRUS TOPPING", [
    ingredient(12, "Tbsp", "unsalted butter, melted, for topping"),
    ingredient(1.5, "cup", "packed brown sugar"),
    ingredient(3, "can", "20 oz pineapple slices, drained with juice reserved"),
    ingredient(4.5, "cup", "all-purpose flour"),
    ingredient(4.5, "tsp", "baking powder"),
    ingredient(0.75, "tsp", "kosher salt"),
    ingredient(1.5, "cup", "unsalted butter, softened"),
    ingredient(2.25, "cup", "granulated sugar"),
    ingredient(6, "each", "large eggs"),
    ingredient(3, "tsp", "vanilla extract"),
    ingredient(0.75, "cup", "reserved pineapple juice"),
    ingredient(0.75, "cup", "milk"),
    ingredient(0.75, "cup", "icing sugar"),
    ingredient(3, "Tbsp", "fresh lime juice"),
    ingredient(3, "tsp", "finely grated orange zest")
  ]],
  ["FRENCH LENTIL", [
    ingredient(4, "cup", "French green lentils, rinsed"),
    ingredient(8, "Tbsp", "olive oil"),
    ingredient(4, "each", "yellow onions, diced"),
    ingredient(8, "each", "carrots, diced"),
    ingredient(8, "each", "celery stalks, diced"),
    ingredient(12, "clove", "garlic, minced"),
    ingredient(8, "Tbsp", "tomato paste"),
    ingredient(2, "cup", "dry red wine"),
    ingredient(24, "cup", "low-sodium vegetable broth"),
    ingredient(4, "each", "bay leaves"),
    ingredient(12, "sprig", "fresh thyme"),
    ingredient(2, "tsp", "kosher salt"),
    ingredient(1, "tsp", "ground black pepper"),
    ingredient(4, "Tbsp", "fresh lemon juice or red wine vinegar"),
    ingredient(1, "cup", "fresh parsley, chopped")
  ]],
  ["COD WITH LEMON&HERB SAUCE (GF/DF)", [
    ingredient(24, "each", "cod fillets, 4 to 5 oz each"),
    ingredient(6, "Tbsp", "olive oil"),
    ingredient(3, "tsp", "onion powder"),
    ingredient(2, "tsp", "kosher salt"),
    ingredient(1, "tsp", "ground black pepper"),
    ingredient(12, "Tbsp", "extra-virgin olive oil"),
    ingredient(12, "each", "shallots, minced"),
    ingredient(18, "clove", "garlic, minced"),
    ingredient(2, "cup", "low-sodium vegetable broth"),
    ingredient(1.5, "cup", "fresh lemon juice"),
    ingredient(6, "tsp", "finely grated lemon zest"),
    ingredient(1.5, "cup", "fresh parsley, chopped"),
    ingredient(6, "Tbsp", "fresh dill, chopped"),
    ingredient(6, "tsp", "cornstarch mixed with cold water")
  ]]
]);

const preserveAudit = Array.isArray(previousAudit?.rows) && previousAudit.rows.length > 0;
const auditRows = preserveAudit
  ? previousAudit.rows.map((row) => row.recipeName === "SAUTEED SHRIMP WITH GARLIC, WHITE WINE & FRESH DICED TOMATO"
    ? { ...row, actionTaken: "Removed heading artifact and rebuilt the full ingredient list from the source URL" }
    : row)
  : [];
let removedCount = preserveAudit ? Number(previousAudit.totals?.artifactsRemoved || 0) : 0;
let rebuiltCount = 0;
let affectedRecipes = preserveAudit ? Number(previousAudit.totals?.affectedRecipes || 0) : 0;

for (const recipe of recipes) {
  const original = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const replacement = rebuilt.get(recipe.title);
  if (replacement) {
    if (!preserveAudit) affectedRecipes++;
    rebuiltCount++;
    const invalidItems = recipe.title === "SAUTEED SHRIMP WITH GARLIC, WHITE WINE & FRESH DICED TOMATO"
      ? original.filter((item) => artifactReason(recipe, item))
      : original;
    for (const item of preserveAudit ? [] : invalidItems) {
      auditRows.push({
        recipeName: recipe.title,
        invalidIngredient: displayIngredient(item),
        sourceUrl: sourceUrl(recipe),
        actionTaken: recipe.title === "SAUTEED SHRIMP WITH GARLIC, WHITE WINE & FRESH DICED TOMATO"
          ? "Removed heading artifact and rebuilt the full ingredient list from the source URL"
          : sourceUrl(recipe)
          ? "Rebuilt ingredient list from recipe content after source extraction was incomplete"
          : "Rebuilt ingredient list from recipe content"
      });
    }
    recipe.ingredients = replacement;
    continue;
  }

  const kept = [];
  let changed = false;
  for (const item of original) {
    const reason = artifactReason(recipe, item);
    if (!reason) {
      kept.push(item);
      continue;
    }
    changed = true;
    if (!preserveAudit) {
      removedCount++;
      auditRows.push({
        recipeName: recipe.title,
        invalidIngredient: displayIngredient(item),
        sourceUrl: sourceUrl(recipe),
        actionTaken: sourceUrl(recipe)
          ? `Removed ${reason.toLowerCase()}; remaining recipe content retained`
          : `Removed ${reason.toLowerCase()}`
      });
    }
  }
  if (changed) {
    if (!preserveAudit) affectedRecipes++;
    recipe.ingredients = kept;
  }
}

const remaining = [];
const malformed = [];
for (const recipe of recipes) {
  if (!Array.isArray(recipe.ingredients)) {
    malformed.push({ recipe: recipe.title, issue: "Ingredients is not an array" });
    continue;
  }
  for (const item of recipe.ingredients) {
    const reason = artifactReason(recipe, item);
    if (reason) remaining.push({ recipe: recipe.title, ingredient: displayIngredient(item), reason });
    if (!item || typeof item !== "object"
      || !Number.isFinite(Number(item.amount))
      || typeof item.unit !== "string"
      || !String(item.name || "").trim()
      || embeddedQuantity.test(String(item.name || ""))) {
      malformed.push({ recipe: recipe.title, ingredient: displayIngredient(item) });
    }
  }
}

if (remaining.length || malformed.length) {
  throw new Error(`Repair validation failed: ${remaining.length} heading artifacts and ${malformed.length} malformed ingredients remain.`);
}

await fs.writeFile(recipesPath, `${JSON.stringify(recipes, null, 2)}\n`);
await fs.writeFile(auditPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  totals: {
    recipesAudited: recipes.length,
    affectedRecipes,
    artifactsRemoved: removedCount,
    recipesRebuiltFromSourceUrls: 1,
    recipesRebuiltFromContent: rebuiltCount - 1,
    remainingHeadingArtifacts: remaining.length,
    remainingMalformedIngredients: malformed.length
  },
  rows: auditRows
}, null, 2)}\n`);

console.log(JSON.stringify({
  recipesAudited: recipes.length,
  affectedRecipes,
  reportRows: auditRows.length,
  artifactsRemoved: removedCount,
  recipesRebuiltFromSourceUrls: 1,
  recipesRebuiltFromContent: rebuiltCount - 1,
  remainingHeadingArtifacts: remaining.length,
  remainingMalformedIngredients: malformed.length
}, null, 2));
