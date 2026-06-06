Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$finalWorkbook = "C:\Users\cjr_1\Downloads\summer-menu-master-final.xlsx"
$menuPath = Join-Path $root "data\processed\clean-menu.json"
$previewPath = Join-Path $root "dinner-change-preview.md"
$snapshotPath = Join-Path $root ".tmp-final-dinner-deployment-snapshot.json"

function Read-XlsxRows([string]$Path) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $sharedReader = [IO.StreamReader]::new($zip.GetEntry("xl/sharedStrings.xml").Open())
        try { [xml]$sharedDocument = $sharedReader.ReadToEnd() } finally { $sharedReader.Dispose() }
        $sharedNs = [Xml.XmlNamespaceManager]::new($sharedDocument.NameTable)
        $sharedNs.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
        $sharedStrings = @(
            $sharedDocument.SelectNodes("//x:sst/x:si", $sharedNs) | ForEach-Object {
                ($_.SelectNodes(".//x:t", $sharedNs) | ForEach-Object InnerText) -join ""
            }
        )

        $sheetReader = [IO.StreamReader]::new($zip.GetEntry("xl/worksheets/sheet1.xml").Open())
        try { [xml]$sheetDocument = $sheetReader.ReadToEnd() } finally { $sheetReader.Dispose() }
        $sheetNs = [Xml.XmlNamespaceManager]::new($sheetDocument.NameTable)
        $sheetNs.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
        $rows = [Collections.Generic.List[object[]]]::new()
        foreach ($row in $sheetDocument.SelectNodes("//x:sheetData/x:row", $sheetNs)) {
            $values = [Collections.Generic.List[object]]::new()
            foreach ($cell in $row.SelectNodes("x:c", $sheetNs)) {
                $value = if ($cell.t -eq "s") {
                    $sharedStrings[[int]$cell.v]
                }
                elseif ($cell.t -eq "inlineStr") {
                    [string]$cell.is.t
                }
                else {
                    [string]$cell.v
                }
                $values.Add($value)
            }
            $rows.Add($values.ToArray())
        }
        foreach ($row in $rows) { Write-Output -NoEnumerate $row }
    }
    finally { $zip.Dispose() }
}

if (-not (Test-Path -LiteralPath $finalWorkbook)) {
    throw "Final workbook not found: $finalWorkbook"
}

$rows = @(Read-XlsxRows $finalWorkbook)
$headers = @($rows[0])
$expectedHeaders = @("Week", "Day", "Category", "Menu Item", "Recipe")
if (($headers -join "|") -ne ($expectedHeaders -join "|")) {
    throw "Unexpected final workbook columns: $($headers -join ', ')"
}

$allowedWeeks = @("Week 1", "Week 2", "Week 3", "Week 4")
$allowedDays = @("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
$allowedCategories = @(
    "Appetizer 1", "Appetizer 2", "Elevated", "Comfort", "Alternative",
    "Veggie 1", "Veggie 2", "Starch", "Dessert"
)

$finalRows = [Collections.Generic.List[object]]::new()
foreach ($row in @($rows | Select-Object -Skip 1)) {
    if ($row.Count -lt 5) { throw "Final workbook contains a row with fewer than five columns." }
    $record = [pscustomobject]@{
        Week = [string]$row[0]
        Day = [string]$row[1]
        Category = [string]$row[2]
        MenuItem = [string]$row[3]
        RecipeText = [string]$row[4]
    }
    if ($record.Week -notin $allowedWeeks) { throw "Out-of-scope week in final workbook: $($record.Week)" }
    if ($record.Day -notin $allowedDays) { throw "Out-of-scope day in final workbook: $($record.Day)" }
    if ($record.Category -notin $allowedCategories) { throw "Out-of-scope category in final workbook: $($record.Category)" }
    if ([string]::IsNullOrWhiteSpace($record.MenuItem)) { throw "Blank menu item in final workbook." }
    $finalRows.Add($record)
}

$finalKeys = @($finalRows | ForEach-Object { "$($_.Week)|$($_.Day)|$($_.Category)" })
$duplicateSlots = @($finalKeys | Group-Object | Where-Object Count -gt 1)
if ($duplicateSlots.Count -gt 0) {
    throw "Duplicate dinner slots in final workbook: $($duplicateSlots.Name -join ', ')"
}

$menu = Get-Content -Raw -LiteralPath $menuPath | ConvertFrom-Json
$lunchSnapshot = $menu.lunch | ConvertTo-Json -Depth 100 -Compress
$currentDinner = @{}
foreach ($week in $allowedWeeks) {
    foreach ($day in $allowedDays) {
        foreach ($category in $allowedCategories) {
            $value = [string]$menu.dinner.weeks.$week.days.$day.$category
            $currentDinner["$week|$day|$category"] = $value
        }
    }
}

$finalDinner = @{}
foreach ($row in $finalRows) {
    $finalDinner["$($row.Week)|$($row.Day)|$($row.Category)"] = $row.MenuItem
}

$added = [Collections.Generic.List[object]]::new()
$removed = [Collections.Generic.List[object]]::new()
$changed = [Collections.Generic.List[object]]::new()
foreach ($week in $allowedWeeks) {
    foreach ($day in $allowedDays) {
        foreach ($category in $allowedCategories) {
            $key = "$week|$day|$category"
            $oldValue = [string]$currentDinner[$key]
            $newValue = if ($finalDinner.ContainsKey($key)) { [string]$finalDinner[$key] } else { "" }
            if ([string]::IsNullOrWhiteSpace($oldValue) -and -not [string]::IsNullOrWhiteSpace($newValue)) {
                $added.Add([pscustomobject]@{ Week = $week; Day = $day; Category = $category; MenuItem = $newValue })
            }
            elseif (-not [string]::IsNullOrWhiteSpace($oldValue) -and [string]::IsNullOrWhiteSpace($newValue)) {
                $removed.Add([pscustomobject]@{ Week = $week; Day = $day; Category = $category; MenuItem = $oldValue })
            }
            elseif ($oldValue -cne $newValue) {
                $changed.Add([pscustomobject]@{
                    Week = $week; Day = $day; Category = $category
                    OldMenuItem = $oldValue; NewMenuItem = $newValue
                })
            }
        }
    }
}

$snapshot = [ordered]@{
    createdAt = [DateTime]::UtcNow.ToString("o")
    finalWorkbook = $finalWorkbook
    finalWorkbookHash = (Get-FileHash -LiteralPath $finalWorkbook -Algorithm SHA256).Hash
    menuHash = (Get-FileHash -LiteralPath $menuPath -Algorithm SHA256).Hash
    recipesHash = (Get-FileHash -LiteralPath (Join-Path $root "data\recipes\sample-recipes.json") -Algorithm SHA256).Hash
    lunchJson = $lunchSnapshot
    finalRows = $finalRows
}
Set-Content -LiteralPath $snapshotPath -Value ($snapshot | ConvertTo-Json -Depth 100) -Encoding UTF8

function Format-Items($Items, [string]$Mode) {
    if ($Items.Count -eq 0) { return "- None" }
    if ($Mode -eq "changed") {
        return (@($Items | ForEach-Object {
            "- $($_.Week) / $($_.Day) / $($_.Category): ``$($_.OldMenuItem)`` -> ``$($_.NewMenuItem)``"
        }) -join "`r`n")
    }
    return (@($Items | ForEach-Object {
        "- $($_.Week) / $($_.Day) / $($_.Category): ``$($_.MenuItem)``"
    }) -join "`r`n")
}

$preview = @"
# Dinner Change Preview

Source of truth: ``C:\Users\cjr_1\Downloads\summer-menu-master-final.xlsx``

Scope: Dinner only, Weeks 1-4, approved nine dinner categories. No production files were modified while generating this preview.

## Summary

| Change | Count |
| --- | ---: |
| Final dinner assignments | $($finalRows.Count) |
| Items added to previously blank slots | $($added.Count) |
| Assignments removed | $($removed.Count) |
| Assignments changed | $($changed.Count) |
| Unchanged populated assignments | $($finalRows.Count - $added.Count - $changed.Count) |
| Final unassigned dinner slots | $(252 - $finalRows.Count) |

## Dinner Menu Items Being Added

$(Format-Items $added "added")

## Dinner Menu Items Being Removed

$(Format-Items $removed "removed")

## Dinner Menu Items Being Changed

$(Format-Items $changed "changed")

## Pre-Deployment Checks

- Final workbook contains only Dinner Weeks 1-4 and approved dinner categories: **Passed**
- Duplicate dinner slots in final workbook: **0**
- Lunch assignments included in preview: **0**
- Lunch production snapshot captured for post-deployment comparison: **Yes**
"@
Set-Content -LiteralPath $previewPath -Value $preview -Encoding UTF8

[pscustomobject]@{
    FinalAssignments = $finalRows.Count
    Added = $added.Count
    Removed = $removed.Count
    Changed = $changed.Count
    FinalUnassignedSlots = 252 - $finalRows.Count
    Preview = $previewPath
    Snapshot = $snapshotPath
} | ConvertTo-Json
