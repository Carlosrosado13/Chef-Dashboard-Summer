import Ajv2020 from "ajv/dist/2020.js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const menuRotationSchemaPath = resolve(currentDir, "../../schemas/menuRotation.schema.json");
const menuRotationSchema = JSON.parse(readFileSync(menuRotationSchemaPath, "utf8"));

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});

const validate = ajv.compile(menuRotationSchema);

function formatInstancePath(instancePath) {
  if (!instancePath) {
    return "Menu rotation";
  }

  return instancePath
    .slice(1)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce((path, part) => {
      if (/^\d+$/.test(part)) {
        return `${path}[${part}]`;
      }

      return path === "Menu rotation" ? part : `${path}.${part}`;
    }, "Menu rotation");
}

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
    case "minProperties":
      return {
        field: location,
        message: `${location} must include at least ${error.params.limit} entry`,
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
        message: error.message || "Invalid menu rotation data.",
        keyword: error.keyword
      };
  }
}

export function validateMenuRotation(menuRotation) {
  const ok = validate(menuRotation);

  if (ok) {
    return { ok: true };
  }

  return {
    ok: false,
    errors: validate.errors.map(describeValidationError)
  };
}

function runCli() {
  const validExample = {
    lunch: {
      weeks: {
        "Week 1": {
          days: {
            Monday: {
              SOUP: "Tomato Soup",
              SALAD: "Garden Salad",
              "MAIN 1": "Chicken Sandwich",
              "MAIN 2": "Vegetable Pasta",
              DESSERT: "Fruit Cup"
            }
          }
        }
      }
    }
  };

  const invalidExample = {
    dinner: {
      weeks: {
        "Week 1": {
          Monday: {
            entree: "Roast Beef"
          }
        }
      }
    }
  };

  console.log("VALID MENU ROTATION:");
  console.log(JSON.stringify(validateMenuRotation(validExample), null, 2));
  console.log("");
  console.log("INVALID MENU ROTATION:");
  console.log(JSON.stringify(validateMenuRotation(invalidExample), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}

export { menuRotationSchema };
