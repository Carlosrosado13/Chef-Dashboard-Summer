param(
    [switch]$IngredientAudit,
    [switch]$FinalManualReview,
    [switch]$FlaggedRecipesReview,
    [switch]$IngredientRootCause,
    [switch]$MenuValidationSeparated,
    [switch]$RemainingArtifactReport
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$modeCount = [int][bool]$IngredientAudit + [int][bool]$FinalManualReview + [int][bool]$FlaggedRecipesReview + [int][bool]$IngredientRootCause + [int][bool]$MenuValidationSeparated + [int][bool]$RemainingArtifactReport
if ($modeCount -gt 1) { throw "Choose only one audit mode." }
$analysisFile = if ($RemainingArtifactReport) { ".tmp-remaining-artifact-report.json" } elseif ($MenuValidationSeparated) { ".tmp-menu-validation-separated.json" } elseif ($IngredientRootCause) { ".tmp-ingredient-validation-root-cause.json" } elseif ($FlaggedRecipesReview) { ".tmp-flagged-recipes-review.json" } elseif ($FinalManualReview) { ".tmp-final-manual-review.json" } elseif ($IngredientAudit) { ".tmp-ingredient-audit.json" } else { ".tmp-final-dinner-deployment-analysis.json" }
$outputFile = if ($RemainingArtifactReport) { "remaining-artifact-report.xlsx" } elseif ($MenuValidationSeparated) { "menu-type-validation-results.xlsx" } elseif ($IngredientRootCause) { "ingredient-validation-root-cause.xlsx" } elseif ($FlaggedRecipesReview) { "flagged-recipes-review.xlsx" } elseif ($FinalManualReview) { "final-manual-review.xlsx" } elseif ($IngredientAudit) { "ingredient-audit-report.xlsx" } else { "recipe-completeness-audit.xlsx" }
$analysisPath = Join-Path $root $analysisFile
$outputPath = Join-Path $root $outputFile
$analysis = Get-Content -Raw -LiteralPath $analysisPath | ConvertFrom-Json
$sheetName = if ($RemainingArtifactReport) { "Remaining Artifact Report" } elseif ($MenuValidationSeparated) { "Menu Validation Results" } elseif ($IngredientRootCause) { "Ingredient Root Cause" } elseif ($FlaggedRecipesReview) { "Flagged Recipes Review" } elseif ($FinalManualReview) { "Final Manual Review" } elseif ($IngredientAudit) { "Ingredient Audit" } else { "Recipe Completeness Audit" }
$tableName = if ($RemainingArtifactReport) { "RemainingArtifactReport" } elseif ($MenuValidationSeparated) { "MenuValidationResults" } elseif ($IngredientRootCause) { "IngredientRootCause" } elseif ($FlaggedRecipesReview) { "FlaggedRecipesReview" } elseif ($FinalManualReview) { "FinalManualReview" } elseif ($IngredientAudit) { "IngredientAudit" } else { "CompletenessAudit" }

function Get-ExcelColumnName([int]$ColumnNumber) {
    $name = ""
    while ($ColumnNumber -gt 0) {
        $ColumnNumber--
        $name = [char](65 + ($ColumnNumber % 26)) + $name
        $ColumnNumber = [Math]::Floor($ColumnNumber / 26)
    }
    return $name
}

function Escape-Xml([string]$Text) {
    if ($null -eq $Text) { return "" }
    return [Security.SecurityElement]::Escape($Text)
}

function Add-ZipTextEntry($Zip, [string]$Name, [string]$Content) {
    $entry = $Zip.CreateEntry($Name, [IO.Compression.CompressionLevel]::Optimal)
    $stream = $entry.Open()
    $writer = [IO.StreamWriter]::new($stream, [Text.UTF8Encoding]::new($false))
    try { $writer.Write($Content) }
    finally { $writer.Dispose(); $stream.Dispose() }
}

function Get-WorksheetXml([object[][]]$Rows) {
    $rowCount = $Rows.Count
    $columnCount = $Rows[0].Count
    $lastColumn = Get-ExcelColumnName $columnCount
    $widthCaps = @(42, 16, 16, 30, 48, 65, 55, 22, 16, 14, 45, 70, 70, 85)
    $builder = [Text.StringBuilder]::new()
    [void]$builder.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$builder.Append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">')
    [void]$builder.Append("<dimension ref=`"A1:$lastColumn$rowCount`"/><sheetViews><sheetView workbookViewId=`"0`"><pane ySplit=`"1`" topLeftCell=`"A2`" activePane=`"bottomLeft`" state=`"frozen`"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight=`"15`"/><cols>")
    for ($column = 0; $column -lt $columnCount; $column++) {
        $maxLength = 12
        foreach ($row in $Rows) { $maxLength = [Math]::Max($maxLength, ([string]$row[$column]).Length + 2) }
        $width = [Math]::Min($widthCaps[$column], $maxLength).ToString("0.##", [Globalization.CultureInfo]::InvariantCulture)
        $number = $column + 1
        [void]$builder.Append("<col min=`"$number`" max=`"$number`" width=`"$width`" customWidth=`"1`"/>")
    }
    [void]$builder.Append("</cols><sheetData>")
    for ($rowIndex = 0; $rowIndex -lt $rowCount; $rowIndex++) {
        $excelRow = $rowIndex + 1
        $height = if ($rowIndex -eq 0) { 24 } else { 45 }
        [void]$builder.Append("<row r=`"$excelRow`" ht=`"$height`" customHeight=`"1`">")
        for ($column = 0; $column -lt $columnCount; $column++) {
            $cell = "$(Get-ExcelColumnName ($column + 1))$excelRow"
            $style = if ($rowIndex -eq 0) { 1 } else { 2 }
            $text = Escape-Xml ([string]$Rows[$rowIndex][$column])
            [void]$builder.Append("<c r=`"$cell`" t=`"inlineStr`" s=`"$style`"><is><t xml:space=`"preserve`">$text</t></is></c>")
        }
        [void]$builder.Append("</row>")
    }
    [void]$builder.Append("</sheetData><autoFilter ref=`"A1:$lastColumn$rowCount`"/><tableParts count=`"1`"><tablePart r:id=`"rId1`"/></tableParts></worksheet>")
    return $builder.ToString()
}

function Get-TableXml([object[][]]$Rows) {
    $columnCount = $Rows[0].Count
    $lastColumn = Get-ExcelColumnName $columnCount
    $builder = [Text.StringBuilder]::new()
    [void]$builder.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$builder.Append("<table xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" id=`"1`" name=`"$tableName`" displayName=`"$tableName`" ref=`"A1:$lastColumn$($Rows.Count)`" totalsRowShown=`"0`"><autoFilter ref=`"A1:$lastColumn$($Rows.Count)`"/><tableColumns count=`"$columnCount`">")
    for ($column = 0; $column -lt $columnCount; $column++) {
        $id = $column + 1
        [void]$builder.Append("<tableColumn id=`"$id`" name=`"$(Escape-Xml ([string]$Rows[0][$column]))`"/>")
    }
    [void]$builder.Append('</tableColumns><tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>')
    return $builder.ToString()
}

$rows = [Collections.Generic.List[object[]]]::new()
if ($RemainingArtifactReport) {
    $rows.Add(@("Recipe Name", "Invalid Ingredient", "Source URL", "Action Taken"))
    foreach ($item in @($analysis.rows)) {
        $rows.Add(@(
            [string]$item.recipeName,
            [string]$item.invalidIngredient,
            [string]$item.sourceUrl,
            [string]$item.actionTaken
        ))
    }
}
elseif ($MenuValidationSeparated) {
    $rows.Add(@(
        "Recipe Name", "Menu Type", "Week", "Day", "Category",
        "Missing Ingredients", "Ingredient Count", "Missing Instructions", "Step Count"
    ))
    foreach ($item in @($analysis.rows)) {
        $rows.Add(@(
            [string]$item.recipeName,
            [string]$item.menuType,
            [string]$item.week,
            [string]$item.day,
            [string]$item.category,
            [string]$item.missingIngredients,
            [string]$item.ingredientCount,
            [string]$item.missingInstructions,
            [string]$item.stepCount
        ))
    }
}
elseif ($IngredientRootCause) {
    $rows.Add(@("Recipe Name", "Ingredient Count", "Ingredient Schema Type", "Source File", "Validation Failure Reason"))
    foreach ($item in @($analysis.rows)) {
        $rows.Add(@(
            [string]$item.recipeName,
            [string]$item.ingredientCount,
            [string]$item.ingredientSchemaType,
            [string]$item.sourceFile,
            [string]$item.validationFailureReason
        ))
    }
}
elseif ($FlaggedRecipesReview) {
    $rows.Add(@(
        "Recipe Name", "Week", "Day", "Category", "Classification", "Reason Flagged",
        "Source URL", "Yield", "Ingredient Count", "Step Count",
        "Generic Ingredients Detected", "Generic Instructions Detected",
        "Current Ingredient List", "Current Step List"
    ))
    foreach ($item in @($analysis.rows)) {
        $rows.Add(@(
            [string]$item.recipeName,
            [string]$item.week,
            [string]$item.day,
            [string]$item.category,
            [string]$item.classification,
            [string]$item.reasonFlagged,
            [string]$item.sourceUrl,
            [string]$item.yield,
            [string]$item.ingredientCount,
            [string]$item.stepCount,
            [string]$item.genericIngredientsDetected,
            [string]$item.genericInstructionsDetected,
            [string]$item.currentIngredientList,
            [string]$item.currentStepList
        ))
    }
}
elseif ($FinalManualReview) {
    $rows.Add(@("Recipe Name", "Issue Type", "Severity", "Recommended Fix", "Source URL"))
    foreach ($item in @($analysis.rows)) {
        $rows.Add(@(
            [string]$item.recipeName,
            [string]$item.issueType,
            [string]$item.severity,
            [string]$item.recommendedFix,
            [string]$item.sourceUrl
        ))
    }
}
elseif ($IngredientAudit) {
    $rows.Add(@("Recipe Name", "Invalid Ingredient", "Reason", "Action Taken"))
    foreach ($item in @($analysis.auditRows)) {
        $rows.Add(@(
            [string]$item.recipeName,
            [string]$item.invalidIngredient,
            [string]$item.reason,
            [string]$item.actionTaken
        ))
    }
}
else {
    $rows.Add(@("Recipe Name", "Issue Type", "Issue Description", "Source URL", "Action Taken"))
    foreach ($item in @($analysis.completenessAudit)) {
        $rows.Add(@(
            [string]$item.recipeName,
            [string]$item.issueType,
            [string]$item.issueDescription,
            [string]$item.sourceUrl,
            [string]$item.actionTaken
        ))
    }
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path -LiteralPath $outputPath) { Remove-Item -LiteralPath $outputPath -Force }
$stream = [IO.File]::Open($outputPath, [IO.FileMode]::CreateNew)
$zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
try {
    Add-ZipTextEntry $zip '[Content_Types].xml' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/></Types>'
    Add-ZipTextEntry $zip '_rels/.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
    Add-ZipTextEntry $zip 'xl/workbook.xml' "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><workbook xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" xmlns:r=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships`"><bookViews><workbookView activeTab=`"0`"/></bookViews><sheets><sheet name=`"$(Escape-Xml $sheetName)`" sheetId=`"1`" r:id=`"rId1`"/></sheets><calcPr calcId=`"191029`" fullCalcOnLoad=`"1`"/></workbook>"
    Add-ZipTextEntry $zip 'xl/_rels/workbook.xml.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
    Add-ZipTextEntry $zip 'xl/styles.xml' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF204070"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9E2F3"/></left><right style="thin"><color rgb="FFD9E2F3"/></right><top style="thin"><color rgb="FFD9E2F3"/></top><bottom style="thin"><color rgb="FFD9E2F3"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>'
    Add-ZipTextEntry $zip 'xl/worksheets/sheet1.xml' (Get-WorksheetXml $rows.ToArray())
    Add-ZipTextEntry $zip 'xl/worksheets/_rels/sheet1.xml.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/></Relationships>'
    Add-ZipTextEntry $zip 'xl/tables/table1.xml' (Get-TableXml $rows.ToArray())
}
finally { $zip.Dispose(); $stream.Dispose() }

Write-Output "Created $(Split-Path -Leaf $outputPath) with $($rows.Count - 1) issue rows."
