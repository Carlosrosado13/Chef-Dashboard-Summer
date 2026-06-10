# Dessert Photo Upload Feature Report

Date: June 10, 2026

## Upload Workflow

1. Open a recipe in the Admin Dessert Editor.
2. Choose **Upload Photo** to use the native device file picker or drag and drop a desktop file.
3. The file picker accepts JPG, JPEG, PNG, and WEBP images. Mobile browsers expose their native camera/photo-library choices through the image file input.
4. The selected image is previewed immediately while it uploads.
5. The Worker validates the declared type, image signature, and 10 MB maximum size.
6. After storage succeeds, the returned repository-relative path automatically populates `photoUrl`.
7. Save the recipe to persist the photo assignment.

The alternate **Paste Image URL** mode remains available. **Delete Photo** clears the recipe photo assignment; replacing or deleting a managed photo removes the previous repository asset after the recipe save succeeds.

## Storage Workflow

- Endpoint: `POST /api/recipe/photo`
- Managed directory: `images/desserts/`
- Generated path format: `images/desserts/<recipe-slug>-<timestamp>-<unique-id>.<extension>`
- Storage backend: the existing GitHub repository and branch configured by `GH_OWNER`, `GH_REPO`, `GH_BRANCH`, and `GH_TOKEN`
- Recipe persistence: `photoUrl` is included in create/update patches and the recipe schema
- Cleanup endpoint: `DELETE /api/recipe/photo`
- Cleanup safety: only paths inside `images/desserts/` with supported image extensions can be deleted

The image upload is committed before recipe save so the editor can receive and populate the final path. Existing managed photos are not deleted until the recipe update succeeds.

## Files Modified

- `css/styles.css`
- `js/adminRecipeEditor.js`
- `js/adminRecipePhoto.js`
- `js/generateRecipePatch.js`
- `js/renderRecipeEditor.js`
- `js/renderRecipeModal.js`
- `package.json`
- `schemas/recipe.schema.json`
- `scripts/validate-photo-ui.mjs`
- `test/recipePhoto.test.js`
- `worker/src/index.js`
- `worker/src/recipePatchApi.js`
- `worker/src/recipePhotoApi.js`

## Validation Results

Status: Passed

- `npm test`: 9 passed, 0 failed
- `npm run validate:recipe`: passed expected valid/invalid fixtures
- Full dataset schema validation: 360 recipes checked, 0 invalid
- `node scripts/validate-photo-ui.mjs`: passed
- `git diff --check`: passed
- JavaScript syntax checks: passed

Headless Chrome UI validation confirmed:

- Desktop file picker upload
- JPG/JPEG/PNG/WEBP accept configuration
- 10 MB client and Worker validation
- Image-signature validation
- Live preview before recipe save
- Automatic `photoUrl` population
- Drag-and-drop replacement
- Image URL mode
- Photo deletion
- Existing recipe empty-photo state
- Recipe-view **Dessert Photo** popup
- Mobile-width layout and native image file input

The browser validation mocked the photo API to avoid writing test images to the production repository. Worker storage and deletion requests were separately validated with mocked GitHub API responses, including repository path, PUT upload, and GET/DELETE cleanup behavior.

## Performance

- No image is fetched or rendered for recipes without `photoUrl`.
- Recipe-view images use lazy loading and open only when the photo control is used.
- Upload encoding and network work occur only after a user selects or drops a file.
- The dashboard recipe dataset remains unchanged except for the optional `photoUrl` field.
