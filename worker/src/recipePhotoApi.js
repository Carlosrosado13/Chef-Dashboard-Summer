import { createError, jsonResponse, parseJsonRequest } from "./recipePatchApi.js";

export const MAX_RECIPE_PHOTO_BYTES = 10 * 1024 * 1024;
export const RECIPE_PHOTO_DIRECTORY = "images/desserts";

const SUPPORTED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

function validateGithubEnv(env) {
  const missing = ["GH_TOKEN", "GH_OWNER", "GH_REPO", "GH_BRANCH"].filter((key) => !env?.[key]);
  return missing.map((key) => ({ message: `Missing environment variable: ${key}` }));
}

function sanitizeSlug(value) {
  return String(value || "dessert")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "dessert";
}

function decodeBase64Bytes(value) {
  const normalized = String(value || "").replace(/\s/g, "");

  if (!normalized || !/^[a-z0-9+/]+={0,2}$/i.test(normalized)) {
    return null;
  }

  try {
    const binary = atob(normalized);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function encodeBase64Bytes(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function detectImageMimeType(bytes) {
  if (
    bytes?.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes?.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes?.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }

  return "";
}

function createPhotoPath(recipeTitle, mimeType) {
  const extension = SUPPORTED_IMAGE_TYPES.get(mimeType);
  const uniqueId = crypto.randomUUID().slice(0, 8);
  return `${RECIPE_PHOTO_DIRECTORY}/${sanitizeSlug(recipeTitle)}-${Date.now()}-${uniqueId}.${extension}`;
}

function isManagedPhotoPath(value) {
  const path = String(value || "").trim().replace(/^\/+/, "");

  return (
    path.startsWith(`${RECIPE_PHOTO_DIRECTORY}/`) &&
    !path.includes("..") &&
    /\.(?:jpe?g|png|webp)$/i.test(path)
  );
}

async function githubRequest(url, env, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GH_TOKEN}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "chef-dashboard-worker",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(data?.message || data?.raw || `GitHub API request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

function createContentsUrl(env, path) {
  return `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents/${path}`;
}

export function validatePhotoUpload(payload) {
  const mimeType = String(payload?.mimeType || "").toLowerCase();
  const bytes = decodeBase64Bytes(payload?.contentBase64);
  const detectedMimeType = detectImageMimeType(bytes);
  const errors = [];

  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    errors.push({ message: "Photo must be a JPG, JPEG, PNG, or WEBP image." });
  }

  if (!bytes?.length) {
    errors.push({ message: "Photo content is required." });
  } else if (bytes.length > MAX_RECIPE_PHOTO_BYTES) {
    errors.push({ message: "Photo must be 10 MB or smaller." });
  } else if (!detectedMimeType || detectedMimeType !== mimeType) {
    errors.push({ message: "Photo content does not match its JPG, PNG, or WEBP format." });
  }

  return {
    ok: errors.length === 0,
    errors,
    mimeType,
    bytes
  };
}

export async function handleUploadRecipePhoto(request, env) {
  const envErrors = validateGithubEnv(env);

  if (envErrors.length > 0) {
    return createError("GitHub image storage is not configured.", 500, envErrors);
  }

  const parsed = await parseJsonRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const validation = validatePhotoUpload(parsed.data);
  if (!validation.ok) {
    return createError("Photo upload validation failed.", 422, validation.errors);
  }

  const photoPath = createPhotoPath(parsed.data?.recipeTitle, validation.mimeType);
  const commitMessage = `Upload dessert photo: ${String(parsed.data?.recipeTitle || "Dessert").trim() || "Dessert"}`;

  try {
    const result = await githubRequest(createContentsUrl(env, photoPath), env, {
      method: "PUT",
      body: JSON.stringify({
        message: commitMessage,
        content: encodeBase64Bytes(validation.bytes),
        branch: env.GH_BRANCH
      })
    });

    return jsonResponse({
      ok: true,
      photoUrl: photoPath,
      path: photoPath,
      size: validation.bytes.length,
      mimeType: validation.mimeType,
      github: {
        commitSha: result.commit?.sha || "",
        contentSha: result.content?.sha || ""
      }
    });
  } catch (error) {
    return createError("Photo upload failed.", 502, [{ message: error.message || "GitHub image upload failed." }]);
  }
}

export async function handleDeleteRecipePhoto(request, env) {
  const envErrors = validateGithubEnv(env);

  if (envErrors.length > 0) {
    return createError("GitHub image storage is not configured.", 500, envErrors);
  }

  const parsed = await parseJsonRequest(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const photoPath = String(parsed.data?.photoUrl || "").trim().replace(/^\/+/, "");
  if (!isManagedPhotoPath(photoPath)) {
    return createError("Only dashboard-managed dessert photos can be deleted.", 422);
  }

  try {
    const file = await githubRequest(
      `${createContentsUrl(env, photoPath)}?ref=${encodeURIComponent(env.GH_BRANCH)}`,
      env
    );
    const result = await githubRequest(createContentsUrl(env, photoPath), env, {
      method: "DELETE",
      body: JSON.stringify({
        message: `Delete dessert photo: ${photoPath.split("/").pop()}`,
        sha: file.sha,
        branch: env.GH_BRANCH
      })
    });

    return jsonResponse({
      ok: true,
      deleted: true,
      photoUrl: photoPath,
      github: {
        commitSha: result.commit?.sha || ""
      }
    });
  } catch (error) {
    if (error.status === 404) {
      return jsonResponse({ ok: true, deleted: false, photoUrl: photoPath });
    }

    return createError("Photo deletion failed.", 502, [{ message: error.message || "GitHub image deletion failed." }]);
  }
}

export { isManagedPhotoPath };
