import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractRecipeFields } from "./extractRecipe.js";
import { normalizeRecipe } from "./normalizeRecipe.js";
import { validateRecipe } from "./validateRecipe.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const testRecipePath = resolve(currentDir, "testRecipe.json");
const invalidRecipePath = resolve(currentDir, "invalidRecipe.json");

export function processRecipe(rawRecipe) {
  try {
    const extractedRecipe = extractRecipeFields(rawRecipe);
    const normalizedRecipe = normalizeRecipe(extractedRecipe);
    const result = validateRecipe(normalizedRecipe);

    if (!result.ok) {
      return {
        ok: false,
        errors: result.errors
      };
    }

    return {
      ok: true,
      recipe: normalizedRecipe
    };
  } catch (error) {
    return {
      ok: false,
      errors: [
        {
          field: "Recipe",
          message: error.message || "Unable to process recipe.",
          keyword: "processRecipe"
        }
      ]
    };
  }
}

function loadJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function printProcessResult(label, rawRecipe) {
  const result = processRecipe(rawRecipe);

  console.log(`${label}:`);

  if (result.ok) {
    console.log("✅ Recipe processed successfully");
    console.log(JSON.stringify(result.recipe, null, 2));
    return;
  }

  console.log("❌ Recipe processing failed");
  for (const error of result.errors) {
    console.log(`- ${error.message}`);
  }
}

function runCli() {
  printProcessResult("VALID RECIPE", loadJsonFile(testRecipePath));
  console.log("");
  printProcessResult("INVALID RECIPE", loadJsonFile(invalidRecipePath));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
