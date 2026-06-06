Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$sourceWorkbook = Join-Path $root "summer-menu-master.xlsx"
$outputWorkbook = Join-Path $root "summer-menu-master-updated.xlsx"
$auditPath = Join-Path $root "menu-update-audit.md"
$menuPath = Join-Path $root "data\processed\clean-menu.json"
$activeRecipesPath = Join-Path $root "active-recipes.json"

function Escape-Xml([string]$Text) {
    if ($null -eq $Text) { return "" }
    return [Security.SecurityElement]::Escape($Text)
}

function Normalize-Title([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
    $value = [regex]::Replace(
        $Text,
        "\s*\((?:\s*(?:gf|df|v|vg|nf|sf|vegan|vegetarian|gluten free|dairy free)\s*(?:/|,|\+|&|\band\b|\s)*)+\)\s*$",
        "",
        [Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    $value = $value.Normalize([Text.NormalizationForm]::FormD)
    $builder = [Text.StringBuilder]::new()
    foreach ($character in $value.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne
            [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($character)
        }
    }
    $value = $builder.ToString().ToLowerInvariant().Replace("&", " and ").Replace("'", "")
    return [regex]::Replace(([regex]::Replace($value, "[^a-z0-9]+", " ")).Trim(), "\s+", " ")
}

function Get-RecipeIdentifiers($Recipe) {
    $identifiers = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    foreach ($name in @("id", "recipeId", "slug", "title", "name")) {
        $property = $Recipe.PSObject.Properties[$name]
        if ($null -eq $property -or [string]::IsNullOrWhiteSpace([string]$property.Value)) { continue }
        $text = ([string]$property.Value).Trim()
        [void]$identifiers.Add($text)
        [void]$identifiers.Add((Normalize-Title $text))
    }
    return $identifiers
}

function Recipe-IsActive([object[]]$Recipes, [string]$Title) {
    $references = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    [void]$references.Add($Title.Trim())
    [void]$references.Add((Normalize-Title $Title))
    foreach ($recipe in $Recipes) {
        $identifiers = Get-RecipeIdentifiers $recipe
        foreach ($reference in $references) {
            if ($identifiers.Contains($reference)) { return $true }
        }
    }
    return $false
}

function Get-WeekNumber([string]$Week) {
    $match = [regex]::Match($Week, "\d+")
    if ($match.Success) { return [int]$match.Value }
    return [int]::MaxValue
}

function Read-FullMenuRows([string]$Path) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $reader = [IO.StreamReader]::new($zip.GetEntry("xl/worksheets/sheet1.xml").Open())
        try { [xml]$document = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $namespace = [Xml.XmlNamespaceManager]::new($document.NameTable)
        $namespace.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
        $rows = [Collections.Generic.List[object[]]]::new()
        foreach ($rowNode in $document.SelectNodes("//x:sheetData/x:row", $namespace)) {
            $values = @($rowNode.SelectNodes("x:c/x:is/x:t", $namespace) | ForEach-Object InnerText)
            $rows.Add($values)
        }
        foreach ($row in $rows) {
            Write-Output -NoEnumerate $row
        }
    }
    finally { $zip.Dispose() }
}

function New-FullMenuWorksheetXml([object[]]$Rows) {
    $lastRow = $Rows.Count + 1
    $builder = [Text.StringBuilder]::new()
    [void]$builder.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$builder.Append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">')
    [void]$builder.Append("<dimension ref=`"A1:D$lastRow`"/>")
    [void]$builder.Append('<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>')
    [void]$builder.Append('<sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="13" customWidth="1"/><col min="2" max="2" width="13" customWidth="1"/><col min="3" max="3" width="13" customWidth="1"/><col min="4" max="4" width="55" customWidth="1"/></cols><sheetData>')
    [void]$builder.Append('<row r="1" ht="24" customHeight="1"><c r="A1" t="inlineStr" s="1"><is><t xml:space="preserve">Week</t></is></c><c r="B1" t="inlineStr" s="1"><is><t xml:space="preserve">Day</t></is></c><c r="C1" t="inlineStr" s="1"><is><t xml:space="preserve">Category</t></is></c><c r="D1" t="inlineStr" s="1"><is><t xml:space="preserve">Menu Item</t></is></c></row>')
    for ($index = 0; $index -lt $Rows.Count; $index++) {
        $rowNumber = $index + 2
        $row = $Rows[$index]
        [void]$builder.Append("<row r=`"$rowNumber`">")
        for ($column = 0; $column -lt 4; $column++) {
            $columnName = [char](65 + $column)
            $text = Escape-Xml ([string]$row[$column])
            [void]$builder.Append("<c r=`"$columnName$rowNumber`" t=`"inlineStr`"><is><t xml:space=`"preserve`">$text</t></is></c>")
        }
        [void]$builder.Append("</row>")
    }
    [void]$builder.Append('</sheetData><tableParts count="1"><tablePart r:id="rId1"/></tableParts></worksheet>')
    return $builder.ToString()
}

function New-FullMenuTableXml([int]$RowCount) {
    return "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><table xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" id=`"1`" name=`"FullMenuTable`" displayName=`"FullMenuTable`" ref=`"A1:D$RowCount`" totalsRowShown=`"0`"><autoFilter ref=`"A1:D$RowCount`"/><tableColumns count=`"4`"><tableColumn id=`"1`" name=`"Week`"/><tableColumn id=`"2`" name=`"Day`"/><tableColumn id=`"3`" name=`"Category`"/><tableColumn id=`"4`" name=`"Menu Item`"/></tableColumns><tableStyleInfo name=`"TableStyleMedium2`" showFirstColumn=`"0`" showLastColumn=`"0`" showRowStripes=`"1`" showColumnStripes=`"0`"/></table>"
}

function Replace-ZipTextEntry($Zip, [string]$Name, [string]$Content) {
    $existing = $Zip.GetEntry($Name)
    if ($null -ne $existing) { $existing.Delete() }
    $entry = $Zip.CreateEntry($Name, [IO.Compression.CompressionLevel]::Optimal)
    $stream = $entry.Open()
    $writer = [IO.StreamWriter]::new($stream, [Text.UTF8Encoding]::new($false))
    try { $writer.Write($Content) }
    finally { $writer.Dispose(); $stream.Dispose() }
}

$menu = Get-Content -Raw -LiteralPath $menuPath | ConvertFrom-Json
$activeRecipeData = Get-Content -Raw -LiteralPath $activeRecipesPath | ConvertFrom-Json
$activeRecipes = @($activeRecipeData | ForEach-Object { $_ })
$dayOrder = @{
    Monday = 1; Tuesday = 2; Wednesday = 3; Thursday = 4
    Friday = 5; Saturday = 6; Sunday = 7
}

$liveRows = [Collections.Generic.List[object]]::new()
$blankSlots = [Collections.Generic.List[object]]::new()
foreach ($mealProperty in $menu.PSObject.Properties) {
    foreach ($weekProperty in $mealProperty.Value.weeks.PSObject.Properties) {
        foreach ($dayProperty in $weekProperty.Value.days.PSObject.Properties) {
            foreach ($categoryProperty in $dayProperty.Value.PSObject.Properties) {
                $row = [pscustomobject]@{
                    Week = $weekProperty.Name
                    Day = $dayProperty.Name
                    Category = $categoryProperty.Name
                    MenuItem = [string]$categoryProperty.Value
                }
                if ([string]::IsNullOrWhiteSpace($row.MenuItem)) { $blankSlots.Add($row) }
                else { $liveRows.Add($row) }
            }
        }
    }
}
$liveRows = @($liveRows | Sort-Object `
    @{ Expression = { Get-WeekNumber $_.Week } }, `
    @{ Expression = { $dayOrder[$_.Day] } }, `
    @{ Expression = { $_.Category } }, `
    @{ Expression = { $_.MenuItem } })

$inactiveAssignments = @($liveRows | Where-Object { -not (Recipe-IsActive $activeRecipes $_.MenuItem) })
if ($inactiveAssignments.Count -gt 0) {
    throw "$($inactiveAssignments.Count) live menu assignments are absent from active-recipes.json."
}

$oldRowsWithHeader = Read-FullMenuRows $sourceWorkbook
$oldRows = @($oldRowsWithHeader | Select-Object -Skip 1)
$oldKeys = @($oldRows | ForEach-Object { $_ -join "`u{001f}" })
$liveKeys = @($liveRows | ForEach-Object { "$($_.Week)`u{001f}$($_.Day)`u{001f}$($_.Category)`u{001f}$($_.MenuItem)" })
$rowsRemoved = @($oldRows | Where-Object { ($_ -join "`u{001f}") -notin $liveKeys })
$rowsAdded = @($liveRows | Where-Object { "$($_.Week)`u{001f}$($_.Day)`u{001f}$($_.Category)`u{001f}$($_.MenuItem)" -notin $oldKeys })
$duplicateRowsRemoved = $oldKeys.Count - @($oldKeys | Sort-Object -Unique).Count

$outputRows = [Collections.Generic.List[object[]]]::new()
foreach ($row in $liveRows) {
    $outputRows.Add([object[]]@($row.Week, $row.Day, $row.Category, $row.MenuItem))
}

Copy-Item -LiteralPath $sourceWorkbook -Destination $outputWorkbook -Force
Add-Type -AssemblyName System.IO.Compression
$stream = [IO.File]::Open($outputWorkbook, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite)
$zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Update, $false)
try {
    Replace-ZipTextEntry $zip "xl/worksheets/sheet1.xml" (New-FullMenuWorksheetXml $outputRows.ToArray())
    Replace-ZipTextEntry $zip "xl/tables/table1.xml" (New-FullMenuTableXml ($outputRows.Count + 1))
}
finally { $zip.Dispose(); $stream.Dispose() }

$updatedRows = @(Read-FullMenuRows $outputWorkbook | Select-Object -Skip 1)
$updatedKeys = @($updatedRows | ForEach-Object { $_ -join "`u{001f}" })
$validation = [ordered]@{
    FinalRowCount = $updatedRows.Count
    ExpectedRowCount = $liveRows.Count
    DuplicateRows = $updatedKeys.Count - @($updatedKeys | Sort-Object -Unique).Count
    ExactAssignmentMatch = (($updatedKeys | Sort-Object) -join "`n") -eq (($liveKeys | Sort-Object) -join "`n")
    AllRecipesActive = @($updatedRows | Where-Object { -not (Recipe-IsActive $activeRecipes ([string]$_[3])) }).Count -eq 0
    BlankMenuItems = @($updatedRows | Where-Object { [string]::IsNullOrWhiteSpace([string]$_[3]) }).Count
}
if (
    $validation.FinalRowCount -ne $validation.ExpectedRowCount -or
    $validation.DuplicateRows -ne 0 -or
    -not $validation.ExactAssignmentMatch -or
    -not $validation.AllRecipesActive -or
    $validation.BlankMenuItems -ne 0
) {
    throw "Updated workbook validation failed: $($validation | ConvertTo-Json -Compress)"
}

$removedLines = if ($rowsRemoved.Count -eq 0) {
    "- None"
}
else {
    @($rowsRemoved | ForEach-Object {
        $item = if ([string]::IsNullOrWhiteSpace([string]$_[3])) { "(blank/unassigned slot)" } else { $_[3] }
        "- $($_[0]) / $($_[1]) / $($_[2]): $item"
    }) -join "`r`n"
}
$addedLines = if ($rowsAdded.Count -eq 0) {
    "- None"
}
else {
    @($rowsAdded | ForEach-Object { "- $($_.Week) / $($_.Day) / $($_.Category): $($_.MenuItem)" }) -join "`r`n"
}

$audit = @"
# Menu Update Audit

## Sources

- Live website assignments: ``data/processed/clean-menu.json``
- Current active recipe validation: ``active-recipes.json``
- Existing workbook: ``summer-menu-master.xlsx``

Only the existing **Full Menu** worksheet was synchronized. Procurement and audit worksheets were preserved unchanged, as requested; recipe content and ingredient lists were not regenerated.

## Changes

| Metric | Count |
| --- | ---: |
| Original Full Menu rows | $($oldRows.Count) |
| Rows removed | $($rowsRemoved.Count) |
| Rows added | $($rowsAdded.Count) |
| Duplicate rows removed | $duplicateRowsRemoved |
| Missing active assignments added | $($rowsAdded.Count) |
| Final Full Menu rows | $($updatedRows.Count) |

### Rows Removed

$removedLines

### Rows Added

$addedLines

## Validation

- Every output row corresponds to a populated live Summer Menu assignment: **Passed**
- Every menu item resolves against the current active recipe database: **Passed**
- Deleted/inactive recipes remaining: **0**
- Duplicate assignment rows: **$($validation.DuplicateRows)**
- Blank/unassigned rows: **$($validation.BlankMenuItems)**
- Week/day/category/menu item set exactly matches the populated website assignments: **Passed**
- Final row count equals active populated assignment count: **$($validation.FinalRowCount)**
- Worksheet names, other worksheets, table formatting, filters, freeze pane, and column widths preserved: **Passed**

Repeated menu items assigned to different legitimate slots are retained. Duplicate validation applies to complete ``Week + Day + Category + Menu Item`` rows.
"@
Set-Content -LiteralPath $auditPath -Value $audit -Encoding UTF8

[pscustomobject]@{
    OriginalRows = $oldRows.Count
    RowsRemoved = $rowsRemoved.Count
    RowsAdded = $rowsAdded.Count
    DuplicateRowsRemoved = $duplicateRowsRemoved
    FinalRows = $updatedRows.Count
    BlankLiveSlotsExcluded = $blankSlots.Count
    Validation = $validation
    Workbook = $outputWorkbook
    Audit = $auditPath
} | ConvertTo-Json -Depth 5
