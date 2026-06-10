import test from "node:test";
import assert from "node:assert/strict";
import { findRecipeByTitle } from "../js/loadRecipes.js";

test("recipe aliases resolve updated menu titles without renaming recipe records", () => {
  const recipe = {
    title: "CHILLED MELON SOUP",
    aliases: ["CHILLED MELON SOUP WITH HERB CRÈME FRAICHE (GF)"],
  };

  assert.equal(
    findRecipeByTitle([recipe], "CHILLED MELON SOUP WITH HERB CRÈME FRAICHE (GF)"),
    recipe,
  );
});
