import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_RECIPE_PHOTO_BYTES,
  validateRecipePhotoFile
} from "../js/adminRecipePhoto.js";
import { generateRecipePatch } from "../js/generateRecipePatch.js";
import {
  handleDeleteRecipePhoto,
  handleUploadRecipePhoto,
  validatePhotoUpload
} from "../worker/src/recipePhotoApi.js";
import { validateRecipe } from "../worker/src/validateRecipe.js";

const recipe = {
  title: "Chocolate Torte",
  yield: "12 servings",
  category: "Dessert",
  ingredients: [{ name: "Chocolate", amount: 1, unit: "lb" }],
  steps: ["Bake the torte."]
};

test("client accepts supported photos up to 10 MB", () => {
  const result = validateRecipePhotoFile({
    name: "torte.JPEG",
    type: "",
    size: MAX_RECIPE_PHOTO_BYTES
  });

  assert.deepEqual(result, { ok: true, mimeType: "image/jpeg" });
});

test("client rejects unsupported and oversized photos", () => {
  assert.equal(validateRecipePhotoFile({
    name: "torte.gif",
    type: "image/gif",
    size: 100
  }).ok, false);

  assert.equal(validateRecipePhotoFile({
    name: "torte.png",
    type: "image/png",
    size: MAX_RECIPE_PHOTO_BYTES + 1
  }).ok, false);
});

test("worker validates supported base64 image payloads", () => {
  const result = validatePhotoUpload({
    mimeType: "image/png",
    contentBase64: "iVBORw0KGgo="
  });

  assert.equal(result.ok, true);
  assert.equal(result.bytes.length, 8);
});

test("worker rejects missing image content and unsupported types", () => {
  const result = validatePhotoUpload({
    mimeType: "image/gif",
    contentBase64: ""
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 2);
});

test("worker rejects files whose bytes do not match the declared image type", () => {
  const result = validatePhotoUpload({
    mimeType: "image/jpeg",
    contentBase64: "iVBORw0KGgo="
  });

  assert.equal(result.ok, false);
  assert.match(result.errors[0].message, /does not match/);
});

test("recipe schema remains compatible with recipes with and without photos", () => {
  assert.equal(validateRecipe(recipe).ok, true);
  assert.equal(validateRecipe({
    ...recipe,
    photoUrl: "images/desserts/chocolate-torte.webp"
  }).ok, true);
});

test("photo replacement is included in recipe patches", () => {
  const patch = generateRecipePatch(
    { ...recipe, photoUrl: "images/desserts/old.jpg" },
    { ...recipe, photoUrl: "images/desserts/new.webp" },
    { ok: true },
    { index: 0 }
  );

  assert.equal(patch.ok, true);
  assert.deepEqual(patch.changedFields.photoUrl, {
    original: "images/desserts/old.jpg",
    updated: "images/desserts/new.webp"
  });
});

test("upload handler stores the image in the repository dessert folder", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    return new Response(JSON.stringify({
      content: { sha: "content-sha" },
      commit: { sha: "commit-sha" }
    }), {
      status: 201,
      headers: { "content-type": "application/json" }
    });
  };

  try {
    const response = await handleUploadRecipePhoto(new Request("https://example.test/api/recipe/photo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipeTitle: "Chocolate Torte",
        mimeType: "image/png",
        contentBase64: "iVBORw0KGgo="
      })
    }), {
      GH_TOKEN: "token",
      GH_OWNER: "owner",
      GH_REPO: "repo",
      GH_BRANCH: "main"
    });
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.ok, true);
    assert.match(result.photoUrl, /^images\/desserts\/chocolate-torte-/);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].options.method, "PUT");
    assert.match(requests[0].url, /contents\/images\/desserts\//);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("delete handler removes a managed repository photo", async () => {
  const originalFetch = globalThis.fetch;
  const methods = [];
  globalThis.fetch = async (_url, options = {}) => {
    methods.push(options.method || "GET");
    return new Response(JSON.stringify(
      options.method === "DELETE"
        ? { commit: { sha: "delete-commit" } }
        : { type: "file", sha: "photo-sha" }
    ), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };

  try {
    const response = await handleDeleteRecipePhoto(new Request("https://example.test/api/recipe/photo", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        photoUrl: "images/desserts/chocolate-torte.png"
      })
    }), {
      GH_TOKEN: "token",
      GH_OWNER: "owner",
      GH_REPO: "repo",
      GH_BRANCH: "main"
    });
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.deleted, true);
    assert.deepEqual(methods, ["GET", "DELETE"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
