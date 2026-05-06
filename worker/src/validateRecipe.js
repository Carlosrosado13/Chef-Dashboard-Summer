import Ajv2020 from "ajv/dist/2020.js";
import recipeSchema from "../../schemas/recipe.schema.json" with { type: "json" };

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});

const validate = ajv.compile(recipeSchema);

function describeValidationError(error) {
  const location = formatInstancePath(error.instancePath);

  switch (error.keyword) {
    case "required":
      return {
        field: location,
        message: `Missing required property: ${error.params.missingProperty}`,
        keyword: error.keyword
      };
    case "additionalProperties":
      return {
        field: location,
        message: `Unknown property is not allowed: ${error.params.additionalProperty}`,
        keyword: error.keyword
      };
    case "minItems":
      return {
        field: location,
        message: `${location} must include at least ${error.params.limit} item`,
        keyword: error.keyword
      };
    case "type":
      return {
        field: location,
        message: `${location} must be ${error.params.type}`,
        keyword: error.keyword
      };
    default:
      return {
        field: location,
        message: error.message || "Invalid recipe data.",
        keyword: error.keyword
      };
  }
}

function formatInstancePath(instancePath) {
  if (!instancePath) {
    return "Recipe";
  }

  return instancePath
    .slice(1)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce((path, part) => {
      if (/^\d+$/.test(part)) {
        return `${path}[${part}]`;
      }

      return path === "Recipe" ? part : `${path}.${part}`;
    }, "Recipe");
}

export function validateRecipe(recipe) {
  const ok = validate(recipe);

  if (ok) {
    return { ok: true };
  }

  return {
    ok: false,
    errors: validate.errors.map(describeValidationError)
  };
}

async function loadJsonFile(filePath) {
  const { readFileSync } = await import("node:fs");
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function printValidationResult(label, recipe) {
  const result = validateRecipe(recipe);

  console.log(`${label}:`);

  if (result.ok) {
    console.log("Recipe is valid");
    return;
  }

  console.log("Validation failed");
  for (const error of result.errors) {
    console.log(`- ${error.message}`);
  }
}

async function runCli() {
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);
  const testRecipePath = resolve(currentDir, "testRecipe.json");
  const invalidRecipePath = resolve(currentDir, "invalidRecipe.json");
  const [testRecipe, invalidRecipe] = await Promise.all([
    loadJsonFile(testRecipePath),
    loadJsonFile(invalidRecipePath)
  ]);

  printValidationResult("VALID RECIPE", testRecipe);
  console.log("");
  printValidationResult("INVALID RECIPE", invalidRecipe);
}

async function maybeRunCli() {
  if (typeof process === "undefined" || !process.argv[1]) {
    return;
  }

  const { pathToFileURL } = await import("node:url");

  if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    runCli();
  }
}

maybeRunCli();

export { recipeSchema };
