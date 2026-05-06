import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { normalizeMenuRotation, normalizeText, normalizeWeekName } from "./normalizeMenuRotation.js";
import { processMenuRotation } from "./processMenuRotation.js";
import { validateMenuRotation } from "./validateMenuRotation.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);
const projectRoot = resolve(currentDir, "../..");
const sourcePath = resolve(projectRoot, "data/raw/winter/menu.json");
const processedDir = resolve(projectRoot, "processed");
const cleanMenuPath = resolve(processedDir, "clean-menu.json");
const migrationReportPath = resolve(processedDir, "migration-report.json");

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function joinPath(parts) {
  return parts.length > 0 ? parts.join(".") : "root";
}

function walkValues(value, visitor, path = []) {
  visitor(value, path);

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValues(item, visitor, [...path, `[${index}]`]));
    return;
  }

  if (isRecord(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      walkValues(childValue, visitor, [...path, key]);
    }
  }
}

function hasEncodingIssue(value) {
  return /(?:â€|â€™|â€œ|â€�|â€“|â€”|Â|�|Ã)/.test(value);
}

function isPlaceholderValue(value) {
  return /^(n\/?a|none|null|undefined|-|--)$/i.test(value.trim());
}

function collectValueIssues(rawData) {
  const encodingIssues = [];
  const placeholderValues = [];
  const missingValues = [];

  walkValues(rawData, (value, path) => {
    if (value === null || value === undefined) {
      missingValues.push({
        path: joinPath(path),
        value
      });
      return;
    }

    if (typeof value !== "string") {
      return;
    }

    if (hasEncodingIssue(value)) {
      encodingIssues.push({
        path: joinPath(path),
        value,
        normalizedValue: normalizeText(value)
      });
    }

    if (isPlaceholderValue(value)) {
      placeholderValues.push({
        path: joinPath(path),
        value,
        normalizedValue: ""
      });
    }

    if (value.trim() === "") {
      missingValues.push({
        path: joinPath(path),
        value
      });
    }
  });

  return {
    encodingIssues,
    placeholderValues,
    missingValues
  };
}

function getWeeksSource(rotation) {
  if (!isRecord(rotation)) {
    return {};
  }

  return isRecord(rotation.weeks) ? rotation.weeks : rotation;
}

function collectNormalizedWeekNames(rawData) {
  const normalizedWeekNames = [];

  for (const mealType of ["lunch", "dinner"]) {
    if (!isRecord(rawData[mealType])) {
      continue;
    }

    for (const weekName of Object.keys(getWeeksSource(rawData[mealType]))) {
      const normalizedWeekName = normalizeWeekName(weekName);

      if (weekName !== normalizedWeekName) {
        normalizedWeekNames.push({
          path: `${mealType}.weeks.${weekName}`,
          from: weekName,
          to: normalizedWeekName
        });
      }
    }
  }

  return normalizedWeekNames;
}

function createMigrationReport(rawData, normalizedData, validationResult) {
  const valueIssues = collectValueIssues(rawData);
  const normalizedWeekNames = collectNormalizedWeekNames(rawData);
  const invalidMenuEntries = validationResult.ok ? [] : validationResult.errors;

  return {
    source: "data/raw/winter/menu.json",
    output: {
      cleanMenu: "processed/clean-menu.json",
      report: "processed/migration-report.json"
    },
    valid: validationResult.ok,
    summary: {
      invalidMenuEntries: invalidMenuEntries.length,
      encodingIssues: valueIssues.encodingIssues.length,
      placeholderValues: valueIssues.placeholderValues.length,
      missingValues: valueIssues.missingValues.length,
      normalizedWeekNames: normalizedWeekNames.length
    },
    invalidMenuEntries,
    encodingIssues: valueIssues.encodingIssues,
    placeholderValues: valueIssues.placeholderValues,
    missingValues: valueIssues.missingValues,
    normalizedWeekNames,
    normalizedTopLevelSections: Object.keys(normalizedData)
  };
}

export function migrateWinterMenu(options = {}) {
  const paths = {
    sourcePath: options.sourcePath || sourcePath,
    processedDir: options.processedDir || processedDir,
    cleanMenuPath: options.cleanMenuPath || cleanMenuPath,
    migrationReportPath: options.migrationReportPath || migrationReportPath
  };

  if (!existsSync(paths.sourcePath)) {
    throw new Error(`Source menu file was not found: ${paths.sourcePath}`);
  }

  const rawData = readJsonFile(paths.sourcePath);
  const normalizedData = normalizeMenuRotation(rawData);
  const validationResult = validateMenuRotation(normalizedData);
  const processResult = processMenuRotation(rawData);
  const report = createMigrationReport(rawData, normalizedData, validationResult);

  mkdirSync(paths.processedDir, { recursive: true });
  writeJsonFile(paths.cleanMenuPath, normalizedData);
  writeJsonFile(paths.migrationReportPath, report);

  return {
    ok: processResult.ok,
    data: normalizedData,
    report,
    paths
  };
}

function logMigrationResult(result) {
  console.log("Winter menu migration complete.");
  console.log(`Clean menu: ${result.paths.cleanMenuPath}`);
  console.log(`Migration report: ${result.paths.migrationReportPath}`);
  console.log(`Validation: ${result.ok ? "passed" : "failed"}`);
  console.log("");
  console.log("Report summary:");
  console.log(`- Invalid menu entries: ${result.report.summary.invalidMenuEntries}`);
  console.log(`- Encoding issues: ${result.report.summary.encodingIssues}`);
  console.log(`- Placeholder values: ${result.report.summary.placeholderValues}`);
  console.log(`- Missing values: ${result.report.summary.missingValues}`);
  console.log(`- Normalized week names: ${result.report.summary.normalizedWeekNames}`);

  if (!result.ok) {
    console.log("");
    console.log("Validation errors:");
    for (const error of result.report.invalidMenuEntries) {
      console.log(`- ${error.message}`);
    }
  }
}

function runCli() {
  console.log("Starting winter menu migration...");
  console.log(`Source: ${sourcePath}`);
  console.log("Original source files will not be modified.");
  console.log("");

  try {
    logMigrationResult(migrateWinterMenu());
  } catch (error) {
    console.error("Winter menu migration failed.");
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
