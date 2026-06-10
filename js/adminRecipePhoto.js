import { adminFetch } from "./adminAuth.js";

export const MAX_RECIPE_PHOTO_BYTES = 10 * 1024 * 1024;
export const RECIPE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

const RECIPE_PHOTO_PATH = "/api/recipe/photo";
const MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

function getPhotoMimeType(file) {
  if (Object.values(MIME_BY_EXTENSION).includes(file?.type)) {
    return file.type;
  }

  const extension = String(file?.name || "").split(".").pop()?.toLowerCase();
  return MIME_BY_EXTENSION[extension] || "";
}

export function validateRecipePhotoFile(file) {
  if (!file) {
    return { ok: false, error: "Choose an image to upload." };
  }

  const mimeType = getPhotoMimeType(file);

  if (!mimeType) {
    return { ok: false, error: "Photo must be a JPG, JPEG, PNG, or WEBP image." };
  }

  if (file.size > MAX_RECIPE_PHOTO_BYTES) {
    return { ok: false, error: "Photo must be 10 MB or smaller." };
  }

  return { ok: true, mimeType };
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    });
    reader.addEventListener("error", () => reject(new Error("Unable to read the selected photo.")));
    reader.readAsDataURL(file);
  });
}

async function readJsonResponse(response) {
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    const details = Array.isArray(result?.details)
      ? result.details.map((detail) => detail.message).filter(Boolean).join(" ")
      : "";
    throw new Error([result?.error, details].filter(Boolean).join(" ") || "Photo request failed.");
  }

  return result;
}

export async function uploadRecipePhoto(file, recipeTitle) {
  const validation = validateRecipePhotoFile(file);

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const contentBase64 = await readFileAsBase64(file);
  const response = await adminFetch(RECIPE_PHOTO_PATH, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      recipeTitle,
      fileName: file.name,
      mimeType: validation.mimeType,
      contentBase64
    })
  });

  return readJsonResponse(response);
}

export async function deleteRecipePhoto(photoUrl) {
  const response = await adminFetch(RECIPE_PHOTO_PATH, {
    method: "DELETE",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ photoUrl })
  });

  return readJsonResponse(response);
}

export function isManagedRecipePhoto(photoUrl) {
  return String(photoUrl || "").replace(/^\/+/, "").startsWith("images/desserts/");
}
