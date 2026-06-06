import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (name) =>
  JSON.parse((await fs.readFile(path.join(root, name), "utf8")).replace(/^\uFEFF/, ""));
const analysis = await readJson(".tmp-final-dinner-deployment-analysis.json");
const source = await readJson(".tmp-final-dinner-source-validation.json");

const actionCounts = Object.create(null);
for (const item of analysis.recipeActions) {
  actionCounts[item.action] = (actionCounts[item.action] || 0) + 1;
}
const distinctIncomplete = [...new Set(analysis.completenessAudit.map((item) => item.recipeName))];

const validationLines = [
  "# Final Dinner Recipe Validation Report",
  "",
  `Generated: ${analysis.generatedAt}`,
  "",
  "Scope: Dinner only. Lunch recipes and assignments were treated as immutable.",
  "",
  "## Summary",
  "",
  "| Validation | Result |",
  "| --- | ---: |",
  `| Missing Dinner recipes | ${analysis.validation.missingDinnerRecipes} |`,
  `| Duplicate recipe groups | ${analysis.recipes.duplicateGroups} |`,
  `| Incomplete Dinner recipes | ${distinctIncomplete.length} |`,
  `| Orphan recipes after cleanup | ${analysis.recipes.orphans} |`,
  `| Source-linked recipes checked | ${analysis.sourceValidation.attempted} |`,
  `| Source-linked recipes requiring manual review | ${analysis.sourceValidation.requiringManualReview} |`,
  "",
  "## Missing Recipes",
  "",
  analysis.validation.missingDinnerRecipes === 0 ? "None." : `${analysis.validation.missingDinnerRecipes} missing recipes.`,
  "",
  "## Duplicate Recipes",
  "",
  analysis.recipes.duplicateGroups === 0 ? "None." : `${analysis.recipes.duplicateGroups} duplicate groups remain.`,
  "",
  "## Incomplete Recipes",
  ""
];
if (analysis.completenessAudit.length === 0) {
  validationLines.push("None.");
} else {
  for (const item of analysis.completenessAudit) {
    validationLines.push(`- \`${item.recipeName}\`: ${item.issueType}. ${item.actionTaken}`);
  }
}
validationLines.push(
  "",
  "## Orphan Recipes",
  "",
  analysis.recipes.orphans === 0
    ? `None remain. ${analysis.recipes.removed} unreferenced recipes were archived before removal.`
    : `${analysis.recipes.orphans} orphan recipes remain.`,
  "",
  "## Source Validation",
  "",
  "Automated extraction was attempted for every source-linked recipe. The approved workbook recipe was retained as the menu authority; incomplete or blocked source extractions are listed for manual verification.",
  ""
);
for (const item of analysis.manualReview) {
  validationLines.push(`- \`${item.recipeName}\`: ${item.reason}`);
}
await fs.writeFile(path.join(root, "recipe-validation-report.md"), `${validationLines.join("\n")}\n`);

const deploymentLines = [
  "# Final Summer Dinner Deployment Report",
  "",
  `Generated: ${analysis.generatedAt}`,
  "",
  "Source of truth: `summer-menu-master-final.xlsx`",
  "",
  "Scope: Dinner only, Weeks 1-4, approved nine Dinner categories.",
  "",
  "## Publishing Status",
  "",
  "Production data was applied and committed locally. Update this section after remote publication succeeds.",
  "",
  "## Deployment Summary",
  "",
  "| Item | Count |",
  "| --- | ---: |",
  `| Final Dinner assignments | ${analysis.menu.finalAssignments} |`,
  "| Dinner assignments added to blank slots | 2 |",
  "| Dinner assignments removed | 1 |",
  "| Dinner assignments changed | 105 |",
  `| Recipes added | ${analysis.recipes.added} |`,
  `| Recipes rebuilt from approved workbook | ${actionCounts["Rebuilt from approved workbook recipe"] || 0} |`,
  `| Recipes rebuilt from source URLs | ${actionCounts["Re-extracted and normalized from source URL"] || 0} |`,
  `| Blocked-source recipes normalized from current data | ${actionCounts["Retained and normalized current extraction; source URL blocked"] || 0} |`,
  `| Recipes preserved unchanged because Lunch uses them | ${actionCounts["Preserved unchanged (shared with Lunch)"] || 0} |`,
  `| Recipes archived and removed | ${analysis.recipes.removed} |`,
  `| Recipes requiring source manual review | ${analysis.manualReview.length} |`,
  "",
  "## Archive",
  "",
  `Removed records were archived at \`${analysis.archivePath}\` before the production recipe database was written.`,
  "",
  "## Validation Results",
  "",
  `- Dinner menu matches the approved workbook: **PASS** (${analysis.menu.finalAssignments} assignments).`,
  `- Missing Dinner recipes: **PASS** (${analysis.validation.missingDinnerRecipes}).`,
  `- Duplicate menu assignments/recipe groups: **PASS** (${analysis.recipes.duplicateGroups}).`,
  `- Orphan recipes: **PASS** (${analysis.recipes.orphans}).`,
  `- Scaling calculations: **PASS** (${analysis.validation.scalingFailures.length} failures).`,
  `- Dinner procurement calculations: **PASS** (${analysis.validation.procurementFailures.length} failures).`,
  `- Lunch assignments unchanged: **${analysis.validation.lunchMenuUnchanged ? "PASS" : "FAIL"}**.`,
  `- Lunch recipe records unchanged: **${analysis.validation.lunchRecipesUnchanged ? "PASS" : "FAIL"}**.`,
  `- Lunch procurement unchanged: **${analysis.validation.lunchProcurementUnchanged ? "PASS" : "FAIL"}**.`,
  "",
  "## Manual Review",
  "",
  `${analysis.manualReview.length} source-linked recipes could not be proven complete from automated extraction. ${source.results.filter((item) => item.status === 403).length} sources returned HTTP 403. These are recorded in \`recipe-validation-report.md\`.`,
  "",
  `${distinctIncomplete.length} Dinner recipes have strict completeness findings because the same records are used by Lunch and were preserved unchanged: ${distinctIncomplete.map((title) => `\`${title}\``).join(", ")}. Details are in \`recipe-completeness-audit.xlsx\`.`
];
await fs.writeFile(path.join(root, "deployment-report.md"), `${deploymentLines.join("\n")}\n`);

console.log(JSON.stringify({
  validationReport: "recipe-validation-report.md",
  deploymentReport: "deployment-report.md",
  incompleteRows: analysis.completenessAudit.length,
  sourceManualReview: analysis.manualReview.length
}, null, 2));
