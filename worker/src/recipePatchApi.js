import { validateRecipe } from "./validateRecipe.js";

const ALLOWED_PATCH_FIELDS = ["title", "yield", "category", "ingredients", "steps"];
const draftPatchStore = new Map();

function createTimestamp() {
  return new Date().toISOString();
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function createError(message, status = 400, details = []) {
  return jsonResponse({
    ok: false,
    error: message,
    details,
    timestamp: createTimestamp()
  }, status);
}

export async function parseJsonRequest(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: createError("Request body must be JSON.", 415)
    };
  }

  try {
    return {
      ok: true,
      data: await request.json()
    };
  } catch {
    return {
      ok: false,
      response: createError("Request JSON could not be parsed.", 400)
    };
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validatePatchStructure(patch) {
  const errors = [];

  if (!isRecord(patch)) {
    return [{ message: "patch must be an object" }];
  }

  if (patch.operation !== "updateRecipe") {
    errors.push({ message: "patch.operation must be updateRecipe" });
  }

  if (!Number.isInteger(patch.index) || patch.index < 0) {
    errors.push({ message: "patch.index must be a non-negative integer" });
  }

  if (!isRecord(patch.changedFields)) {
    errors.push({ message: "patch.changedFields must be an object" });
    return errors;
  }

  for (const [field, change] of Object.entries(patch.changedFields)) {
    if (!ALLOWED_PATCH_FIELDS.includes(field)) {
      errors.push({ message: `patch.changedFields.${field} is not allowed` });
      continue;
    }

    if (!isRecord(change) || !Object.hasOwn(change, "original") || !Object.hasOwn(change, "updated")) {
      errors.push({ message: `patch.changedFields.${field} must include original and updated values` });
    }
  }

  if (Object.keys(patch.changedFields).length === 0) {
    errors.push({ message: "patch.changedFields must include at least one changed field" });
  }

  return errors;
}

function buildUpdatedRecipe(payload) {
  if (isRecord(payload.updatedRecipe)) {
    return structuredClone(payload.updatedRecipe);
  }

  if (!isRecord(payload.originalRecipe)) {
    return null;
  }

  const updatedRecipe = structuredClone(payload.originalRecipe);

  for (const [field, change] of Object.entries(payload.patch.changedFields || {})) {
    updatedRecipe[field] = structuredClone(change.updated);
  }

  return updatedRecipe;
}

export function validateRecipePatchPayload(payload) {
  const errors = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      errors: [{ message: "payload must be an object" }]
    };
  }

  errors.push(...validatePatchStructure(payload.patch));

  const updatedRecipe = buildUpdatedRecipe(payload);

  if (!updatedRecipe) {
    errors.push({ message: "payload must include updatedRecipe or originalRecipe" });
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors
    };
  }

  const recipeValidation = validateRecipe(updatedRecipe);

  if (!recipeValidation.ok) {
    return {
      ok: false,
      errors: recipeValidation.errors,
      updatedRecipe
    };
  }

  return {
    ok: true,
    patch: payload.patch,
    updatedRecipe
  };
}

export async function handleValidatePatch(request) {
  console.log(`[recipe-api] ${request.method} /api/recipe/validate-patch ${createTimestamp()}`);

  const parsed = await parseJsonRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const result = validateRecipePatchPayload(parsed.data);

  if (!result.ok) {
    return createError("Recipe patch validation failed.", 422, result.errors);
  }

  return jsonResponse({
    ok: true,
    message: "Recipe patch is valid.",
    patch: result.patch,
    updatedRecipe: result.updatedRecipe,
    timestamp: createTimestamp()
  });
}

export async function handleSaveDraft(request) {
  console.log(`[recipe-api] ${request.method} /api/recipe/save-draft ${createTimestamp()}`);

  const parsed = await parseJsonRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const result = validateRecipePatchPayload(parsed.data);

  if (!result.ok) {
    return createError("Draft patch was not saved because validation failed.", 422, result.errors);
  }

  const draftId = parsed.data.draftId || `${result.patch.index}:${result.patch.updatedTitle || result.patch.originalTitle || "recipe"}`;
  const savedAt = createTimestamp();
  const record = {
    draftId,
    patch: structuredClone(result.patch),
    updatedRecipe: structuredClone(result.updatedRecipe),
    savedAt
  };

  draftPatchStore.set(draftId, record);

  return jsonResponse({
    ok: true,
    message: "Draft patch saved in temporary memory.",
    draftId,
    savedAt,
    storedDraftCount: draftPatchStore.size,
    timestamp: createTimestamp()
  });
}

export { draftPatchStore };
