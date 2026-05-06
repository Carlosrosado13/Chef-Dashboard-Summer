import Ajv2020 from "ajv/dist/2020";
import recipeSchema from "../../schemas/recipe.schema.json" with { type: "json" };

const ajv = new Ajv2020({
  allErrors: true,
  strict: true
});

const validate = ajv.compile(recipeSchema);

function describeValidationError(error) {
  const location = error.instancePath || "/";

  switch (error.keyword) {
    case "required":
      return {
        field: location,
        message: `Missing required field "${error.params.missingProperty}".`,
        keyword: error.keyword
      };
    case "additionalProperties":
      return {
        field: location,
        message: `Unknown field "${error.params.additionalProperty}" is not allowed.`,
        keyword: error.keyword
      };
    case "minItems":
      return {
        field: location,
        message: `Expected at least ${error.params.limit} item.`,
        keyword: error.keyword
      };
    case "type":
      return {
        field: location,
        message: `Expected ${error.params.type}.`,
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

export { recipeSchema };
