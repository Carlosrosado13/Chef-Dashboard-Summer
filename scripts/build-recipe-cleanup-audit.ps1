Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$menuPath = Join-Path $root "data\processed\clean-menu.json"
$recipesPath = Join-Path $root "data\recipes\sample-recipes.json"
$winterPath = Join-Path $root "data\raw\Winter\menu.json"
$masterPath = Join-Path $root "summer-menu-master.xlsx"

$activeJsonPath = Join-Path $root "active-recipes.json"
$unusedWorkbookPath = Join-Path $root "unused-recipes-report.xlsx"
$testWorkbookPath = Join-Path $root "test-data-report.xlsx"
$cleanWorkbookPath = Join-Path $root "menu-master-clean.xlsx"
$safeDeletePath = Join-Path $root "recipes-safe-to-delete.json"

function Normalize-RecipeTitle([string]$Text) {
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
    $value = $builder.ToString().ToLowerInvariant()
    $value = $value.Replace("&", " and ").Replace("'", "").Replace(([string][char]0x2019), "")
    $value = [regex]::Replace($value, "[^a-z0-9]+", " ")
    return [regex]::Replace($value.Trim(), "\s+", " ")
}

function Get-RecipeId([string]$Text) {
    return (Normalize-RecipeTitle $Text).Replace(" ", "-").Trim("-")
}

function Get-Field($Object, [string]$Name) {
    if ($null -eq $Object) { return $null }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) { return $null }
    return $property.Value
}

function Get-IdentifierSet($RecipeOrReference) {
    $identifiers = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    $values = if ($RecipeOrReference -is [string]) {
        @($RecipeOrReference)
    }
    elseif ($null -ne $RecipeOrReference) {
        @(
            (Get-Field $RecipeOrReference "id"),
            (Get-Field $RecipeOrReference "recipeId"),
            (Get-Field $RecipeOrReference "slug"),
            (Get-Field $RecipeOrReference "title"),
            (Get-Field $RecipeOrReference "name")
        )
    }
    else { @() }

    foreach ($value in $values) {
        $text = [string]$value
        if ([string]::IsNullOrWhiteSpace($text)) { continue }
        $text = $text.Trim()
        [void]$identifiers.Add($text)
        $normalized = Normalize-RecipeTitle $text
        $recipeId = Get-RecipeId $text
        if ($normalized) { [void]$identifiers.Add($normalized) }
        if ($recipeId) { [void]$identifiers.Add($recipeId) }
    }
    return $identifiers
}

function Find-RecipeIndex([object[]]$Recipes, [string]$Reference) {
    $referenceIdentifiers = Get-IdentifierSet $Reference
    if ($referenceIdentifiers.Count -eq 0) { return -1 }
    for ($index = 0; $index -lt $Recipes.Count; $index++) {
        $recipeIdentifiers = Get-IdentifierSet $Recipes[$index]
        foreach ($identifier in $referenceIdentifiers) {
            if ($recipeIdentifiers.Contains($identifier)) { return $index }
        }
    }
    return -1
}

function Get-RecipeSource($Recipe) {
    $metadata = Get-Field $Recipe "metadata"
    foreach ($value in @(
        (Get-Field $metadata "sourceUrl"),
        (Get-Field $metadata "source"),
        (Get-Field $metadata "importedFrom"),
        (Get-Field $metadata "rebuiltFrom"),
        (Get-Field $Recipe "source"),
        (Get-Field $Recipe "url")
    )) {
        if (-not [string]::IsNullOrWhiteSpace([string]$value)) { return [string]$value }
    }
    return "sample-recipes.json (legacy/no source metadata)"
}

function Get-AllStringValues($Value) {
    $results = [Collections.Generic.List[string]]::new()
    if ($Value -is [string]) {
        if (-not [string]::IsNullOrWhiteSpace($Value)) { $results.Add($Value) }
    }
    elseif ($Value -is [Collections.IDictionary]) {
        foreach ($entry in $Value.GetEnumerator()) {
            foreach ($text in Get-AllStringValues $entry.Value) { $results.Add($text) }
        }
    }
    elseif ($Value -is [Collections.IEnumerable] -and $Value -isnot [string]) {
        foreach ($item in $Value) {
            foreach ($text in Get-AllStringValues $item) { $results.Add($text) }
        }
    }
    elseif ($null -ne $Value -and @($Value.PSObject.Properties).Count -gt 0) {
        foreach ($property in $Value.PSObject.Properties) {
            foreach ($text in Get-AllStringValues $property.Value) { $results.Add($text) }
        }
    }
    return $results
}

function Has-RecipeLinkMetadata($Recipe) {
    $metadata = Get-Field $Recipe "metadata"
    if ($null -eq $metadata) { return $false }
    if (-not [string]::IsNullOrWhiteSpace([string](Get-Field $metadata "menuSlot"))) { return $true }
    $assignments = Get-Field $metadata "assignments"
    if ($null -ne $assignments -and @($assignments).Count -gt 0) { return $true }
    if (-not [string]::IsNullOrWhiteSpace([string](Get-Field $metadata "recipeLink"))) { return $true }
    return $false
}

function Is-PlaceholderRecipe($Recipe) {
    $tags = @((Get-Field $Recipe "tags") | ForEach-Object { ([string]$_).ToLowerInvariant() })
    if ($tags -contains "placeholder") { return $true }
    $metadata = Get-Field $Recipe "metadata"
    if ((Get-Field $Recipe "placeholder") -eq $true -or (Get-Field $metadata "placeholder") -eq $true) { return $true }
    if (([string](Get-Field $Recipe "title")).ToLowerInvariant().Contains("placeholder")) { return $true }
    if (([string](Get-Field $metadata "source")).ToLowerInvariant().Contains("placeholder")) { return $true }
    if ((@((Get-Field $Recipe "notes")) -join " ").ToLowerInvariant().Contains("placeholder")) { return $true }
    foreach ($ingredient in @((Get-Field $Recipe "ingredients"))) {
        if ((Normalize-RecipeTitle ([string](Get-Field $ingredient "name"))) -eq "recipe details pending") { return $true }
    }
    foreach ($step in @((Get-Field $Recipe "steps"))) {
        if ((Normalize-RecipeTitle ([string]$step)).StartsWith("placeholder recipe created to link")) { return $true }
    }
    return $false
}

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

function Get-WorksheetXml([object[][]]$Rows, [int[]]$WrapColumns) {
    $rowCount = $Rows.Count
    $columnCount = $Rows[0].Count
    $lastColumn = Get-ExcelColumnName $columnCount
    $widths = [double[]]::new($columnCount)
    for ($column = 0; $column -lt $columnCount; $column++) {
        $maxLength = 11
        foreach ($row in $Rows) {
            $length = ([string]$row[$column]).Length
            if ($length -gt $maxLength) { $maxLength = $length }
        }
        $cap = if ($WrapColumns -contains ($column + 1)) { 55 } else { 45 }
        $widths[$column] = [Math]::Min($cap, [Math]::Max(11, $maxLength + 2))
    }

    $builder = [Text.StringBuilder]::new()
    [void]$builder.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$builder.Append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">')
    [void]$builder.Append("<dimension ref=`"A1:$lastColumn$rowCount`"/>")
    [void]$builder.Append('<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>')
    for ($column = 0; $column -lt $columnCount; $column++) {
        $number = $column + 1
        $width = $widths[$column].ToString("0.##", [Globalization.CultureInfo]::InvariantCulture)
        [void]$builder.Append("<col min=`"$number`" max=`"$number`" width=`"$width`" customWidth=`"1`"/>")
    }
    [void]$builder.Append('</cols><sheetData>')
    for ($rowIndex = 0; $rowIndex -lt $rowCount; $rowIndex++) {
        $excelRow = $rowIndex + 1
        $height = if ($rowIndex -eq 0) { ' ht="24" customHeight="1"' } elseif ($WrapColumns.Count -gt 0) { ' ht="45" customHeight="1"' } else { "" }
        [void]$builder.Append("<row r=`"$excelRow`"$height>")
        for ($column = 0; $column -lt $columnCount; $column++) {
            $cellReference = "$(Get-ExcelColumnName ($column + 1))$excelRow"
            $styleId = if ($rowIndex -eq 0) { 1 } elseif ($WrapColumns -contains ($column + 1)) { 2 } else { 0 }
            $text = Escape-Xml ([string]$Rows[$rowIndex][$column])
            [void]$builder.Append("<c r=`"$cellReference`" t=`"inlineStr`" s=`"$styleId`"><is><t xml:space=`"preserve`">$text</t></is></c>")
        }
        [void]$builder.Append('</row>')
    }
    [void]$builder.Append("</sheetData><tableParts count=`"1`"><tablePart r:id=`"rId1`"/></tableParts></worksheet>")
    return $builder.ToString()
}

function Get-TableXml([object[][]]$Rows, [string]$TableName) {
    $columnCount = $Rows[0].Count
    $lastColumn = Get-ExcelColumnName $columnCount
    $builder = [Text.StringBuilder]::new()
    [void]$builder.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$builder.Append("<table xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" id=`"1`" name=`"$TableName`" displayName=`"$TableName`" ref=`"A1:$lastColumn$($Rows.Count)`" totalsRowShown=`"0`"><autoFilter ref=`"A1:$lastColumn$($Rows.Count)`"/><tableColumns count=`"$columnCount`">")
    for ($column = 0; $column -lt $columnCount; $column++) {
        $id = $column + 1
        [void]$builder.Append("<tableColumn id=`"$id`" name=`"$(Escape-Xml ([string]$Rows[0][$column]))`"/>")
    }
    [void]$builder.Append('</tableColumns><tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>')
    return $builder.ToString()
}

function Write-SingleSheetWorkbook(
    [string]$Path,
    [string]$SheetName,
    [string]$TableName,
    [object[][]]$Rows,
    [int[]]$WrapColumns = @()
) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Force }
    $stream = [IO.File]::Open($Path, [IO.FileMode]::CreateNew)
    $zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        Add-ZipTextEntry $zip '[Content_Types].xml' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/></Types>'
        Add-ZipTextEntry $zip '_rels/.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
        Add-ZipTextEntry $zip 'xl/workbook.xml' "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><workbook xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" xmlns:r=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships`"><bookViews><workbookView activeTab=`"0`"/></bookViews><sheets><sheet name=`"$(Escape-Xml $SheetName)`" sheetId=`"1`" r:id=`"rId1`"/></sheets><calcPr calcId=`"191029`" fullCalcOnLoad=`"1`"/></workbook>"
        Add-ZipTextEntry $zip 'xl/_rels/workbook.xml.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'
        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF204070"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9E2F3"/></left><right style="thin"><color rgb="FFD9E2F3"/></right><top style="thin"><color rgb="FFD9E2F3"/></top><bottom style="thin"><color rgb="FFD9E2F3"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>'
        Add-ZipTextEntry $zip 'xl/styles.xml' $styles
        Add-ZipTextEntry $zip 'xl/worksheets/sheet1.xml' (Get-WorksheetXml $Rows $WrapColumns)
        Add-ZipTextEntry $zip 'xl/worksheets/_rels/sheet1.xml.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/></Relationships>'
        Add-ZipTextEntry $zip 'xl/tables/table1.xml' (Get-TableXml $Rows $TableName)
    }
    finally { $zip.Dispose(); $stream.Dispose() }
}

function Read-FirstSheetRows([string]$Path) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $reader = [IO.StreamReader]::new($zip.GetEntry("xl/worksheets/sheet1.xml").Open())
        try { [xml]$document = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $namespace = [Xml.XmlNamespaceManager]::new($document.NameTable)
        $namespace.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
        $rows = [Collections.Generic.List[object[]]]::new()
        foreach ($rowNode in $document.SelectNodes("//x:sheetData/x:row", $namespace)) {
            $values = [Collections.Generic.List[object]]::new()
            foreach ($cell in $rowNode.SelectNodes("x:c", $namespace)) {
                $textNode = $cell.SelectSingleNode("x:is/x:t", $namespace)
                $cellValue = if ($null -ne $textNode) { $textNode.InnerText } else { [string]$cell.v }
                $values.Add($cellValue)
            }
            $rows.Add($values.ToArray())
        }
        return $rows
    }
    finally { $zip.Dispose() }
}

$menu = Get-Content -Raw -LiteralPath $menuPath | ConvertFrom-Json
$recipeData = Get-Content -Raw -LiteralPath $recipesPath | ConvertFrom-Json
$recipes = @($recipeData | ForEach-Object { $_ })
$winterMenu = Get-Content -Raw -LiteralPath $winterPath | ConvertFrom-Json

$menuSlots = [Collections.Generic.List[object]]::new()
foreach ($mealProperty in $menu.PSObject.Properties) {
    foreach ($weekProperty in $mealProperty.Value.weeks.PSObject.Properties) {
        foreach ($dayProperty in $weekProperty.Value.days.PSObject.Properties) {
            foreach ($categoryProperty in $dayProperty.Value.PSObject.Properties) {
                $menuSlots.Add([pscustomobject]@{
                    Meal = $mealProperty.Name
                    Week = $weekProperty.Name
                    Day = $dayProperty.Name
                    Category = $categoryProperty.Name
                    MenuItem = [string]$categoryProperty.Value
                })
            }
        }
    }
}

$masterRows = Read-FirstSheetRows $masterPath
if ($masterRows.Count -ne ($menuSlots.Count + 1)) {
    throw "summer-menu-master.xlsx row count does not match the active menu."
}
$masterKeys = @($masterRows | Select-Object -Skip 1 | ForEach-Object { "$($_[0])`u{001f}$($_[1])`u{001f}$($_[2])`u{001f}$($_[3])" } | Sort-Object)
$menuKeys = @($menuSlots | ForEach-Object { "$($_.Week)`u{001f}$($_.Day)`u{001f}$($_.Category)`u{001f}$($_.MenuItem)" } | Sort-Object)
if (($masterKeys -join "`n") -ne ($menuKeys -join "`n")) {
    throw "summer-menu-master.xlsx menu rows differ from data/processed/clean-menu.json."
}

$activeIndices = [Collections.Generic.HashSet[int]]::new()
$assignmentMap = @{}
$unresolvedSlots = [Collections.Generic.List[object]]::new()
foreach ($slot in $menuSlots) {
    if ([string]::IsNullOrWhiteSpace($slot.MenuItem)) { continue }
    $index = Find-RecipeIndex $recipes $slot.MenuItem
    if ($index -lt 0) {
        $unresolvedSlots.Add($slot)
        continue
    }
    [void]$activeIndices.Add($index)
    if (-not $assignmentMap.ContainsKey($index)) { $assignmentMap[$index] = [Collections.Generic.List[string]]::new() }
    $assignmentMap[$index].Add("$($slot.Meal) $($slot.Week) $($slot.Day) $($slot.Category)")
}
if ($unresolvedSlots.Count -gt 0) { throw "$($unresolvedSlots.Count) live menu slots do not resolve to recipes." }

$duplicateGroups = @(
    $recipes |
        ForEach-Object -Begin { $index = -1 } -Process {
            $index++
            [pscustomobject]@{ Index = $index; Title = [string]$_.title; Normalized = Normalize-RecipeTitle ([string]$_.title) }
        } |
        Group-Object Normalized |
        Where-Object { $_.Name -and $_.Count -gt 1 }
)
$duplicateIndexMap = @{}
foreach ($group in $duplicateGroups) {
    $titles = @($group.Group.Title) -join " | "
    foreach ($record in $group.Group) { $duplicateIndexMap[$record.Index] = $titles }
}

$winterTitles = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($text in Get-AllStringValues $winterMenu) {
    [void]$winterTitles.Add((Normalize-RecipeTitle $text))
    if ($text.Contains(":")) { [void]$winterTitles.Add((Normalize-RecipeTitle ($text.Split(":", 2)[1]))) }
}

$records = [Collections.Generic.List[object]]::new()
for ($index = 0; $index -lt $recipes.Count; $index++) {
    $recipe = $recipes[$index]
    $active = $activeIndices.Contains($index)
    $flags = [Collections.Generic.List[string]]::new()
    $metadata = Get-Field $recipe "metadata"
    $haystack = @(
        [string](Get-Field $recipe "title"),
        [string](Get-Field $recipe "category"),
        (Get-RecipeSource $recipe),
        (@((Get-Field $recipe "tags")) -join " "),
        (@((Get-Field $recipe "notes")) -join " "),
        ($metadata | ConvertTo-Json -Compress -Depth 20)
    ) -join " "
    if ($haystack -match "(?i)\b(test|demo|sample recipe|temporary|temp import|development|dev recipe|dummy|example)\b") {
        $flags.Add("Test/demo/development indicator")
    }
    if (Is-PlaceholderRecipe $recipe) { $flags.Add("Placeholder recipe") }
    if (-not $active -and $winterTitles.Contains((Normalize-RecipeTitle ([string]$recipe.title)))) {
        $flags.Add("Winter menu leftover")
    }
    if ($duplicateIndexMap.ContainsKey($index)) { $flags.Add("Duplicate normalized title") }

    $hasLinkMetadata = Has-RecipeLinkMetadata $recipe
    $safeToDelete = (-not $active) -and (-not $hasLinkMetadata)
    $records.Add([pscustomobject]@{
        Index = $index
        Recipe = $recipe
        Title = [string]$recipe.title
        Source = Get-RecipeSource $recipe
        Category = [string]$recipe.category
        Active = $active
        Assigned = $active
        WebsiteVisible = $active
        HasRecipeLinkMetadata = $hasLinkMetadata
        SafeToDelete = $safeToDelete
        Flags = @($flags)
        DuplicateGroup = if ($duplicateIndexMap.ContainsKey($index)) { $duplicateIndexMap[$index] } else { "" }
        Assignments = if ($assignmentMap.ContainsKey($index)) { @($assignmentMap[$index]) } else { @() }
    })
}

$activeRecords = @($records | Where-Object Active)
$unusedRecords = @($records | Where-Object { -not $_.Active })
$testRecords = @($records | Where-Object { $_.Flags.Count -gt 0 })
$safeDeleteRecords = @($records | Where-Object SafeToDelete)

$activeRecipes = @($activeRecords | Sort-Object Index | ForEach-Object Recipe)
$safeDeleteRecipes = @($safeDeleteRecords | Sort-Object Index | ForEach-Object Recipe)
Set-Content -LiteralPath $activeJsonPath -Value ($activeRecipes | ConvertTo-Json -Depth 100) -Encoding UTF8
Set-Content -LiteralPath $safeDeletePath -Value ($safeDeleteRecipes | ConvertTo-Json -Depth 100) -Encoding UTF8

$unusedRows = [Collections.Generic.List[object[]]]::new()
$unusedRows.Add([object[]]@("Recipe Name", "Source", "Category", "Assigned? (Y/N)", "Website Visible? (Y/N)", "Safe To Delete? (Y/N)"))
foreach ($record in $unusedRecords | Sort-Object Title) {
    $unusedRows.Add([object[]]@(
        $record.Title,
        $record.Source,
        $record.Category,
        $(if ($record.Assigned) { "Y" } else { "N" }),
        $(if ($record.WebsiteVisible) { "Y" } else { "N" }),
        $(if ($record.SafeToDelete) { "Y" } else { "N" })
    ))
}
Write-SingleSheetWorkbook $unusedWorkbookPath "Unused Recipes" "UnusedRecipesTable" $unusedRows.ToArray()

$testRows = [Collections.Generic.List[object[]]]::new()
$testRows.Add([object[]]@("Recipe Name", "Flags", "Active? (Y/N)", "Duplicate Group", "Source", "Category", "Safe To Delete? (Y/N)"))
foreach ($record in $testRecords | Sort-Object @{ Expression = { -not $_.Active } }, Title) {
    $testRows.Add([object[]]@(
        $record.Title,
        ($record.Flags -join "; "),
        $(if ($record.Active) { "Y" } else { "N" }),
        $record.DuplicateGroup,
        $record.Source,
        $record.Category,
        $(if ($record.SafeToDelete) { "Y" } else { "N" })
    ))
}
Write-SingleSheetWorkbook $testWorkbookPath "Test Data Audit" "TestDataAuditTable" $testRows.ToArray() @(2, 4)

$cleanRows = [Collections.Generic.List[object[]]]::new()
$cleanRows.Add([object[]]@("Recipe Name", "Category", "Yield", "Ingredients", "Instructions", "Source", "Current Menu Assignments"))
foreach ($record in $activeRecords | Sort-Object Index) {
    $ingredientText = @(
        foreach ($ingredient in @($record.Recipe.ingredients)) {
            "$($ingredient.amount) $($ingredient.unit) $($ingredient.name)".Trim()
        }
    ) -join "`n"
    $instructionNumber = 0
    $instructionText = @(
        foreach ($step in @($record.Recipe.steps)) {
            $instructionNumber++
            "$instructionNumber. $step"
        }
    ) -join "`n"
    $cleanRows.Add([object[]]@(
        $record.Title,
        $record.Category,
        [string]$record.Recipe.yield,
        $ingredientText,
        $instructionText,
        $record.Source,
        ($record.Assignments -join "; ")
    ))
}
Write-SingleSheetWorkbook $cleanWorkbookPath "Active Recipes" "ActiveRecipesTable" $cleanRows.ToArray() @(4, 5, 7)

$expectedOutputs = @($activeJsonPath, $unusedWorkbookPath, $testWorkbookPath, $cleanWorkbookPath, $safeDeletePath)
foreach ($output in $expectedOutputs) {
    if (-not (Test-Path -LiteralPath $output) -or (Get-Item -LiteralPath $output).Length -eq 0) {
        throw "Output validation failed: $output"
    }
}
if ($activeRecipes.Count -ne $activeIndices.Count) { throw "Active recipe JSON count mismatch." }
if ($safeDeleteRecipes.Count -ne $safeDeleteRecords.Count) { throw "Safe-delete JSON count mismatch." }
if ($cleanRows.Count -ne ($activeRecipes.Count + 1)) { throw "Clean workbook row count mismatch." }
if (@($activeRecords | Where-Object { -not $_.Active }).Count -gt 0) {
    throw "Inactive recipe entered the active master."
}
if (@($activeRecords | Where-Object { @($_.Assignments).Count -eq 0 }).Count -gt 0) {
    throw "An active recipe is not linked to a current menu item."
}

[pscustomobject]@{
    TotalRecipes = $recipes.Count
    ActiveRecipes = $activeRecords.Count
    UnusedRecipes = $unusedRecords.Count
    DuplicateGroups = $duplicateGroups.Count
    DuplicateRecipes = ($duplicateGroups | ForEach-Object { $_.Count - 1 } | Measure-Object -Sum).Sum
    TestRecipes = $testRecords.Count
    ActivePlaceholderRecipes = @($activeRecords | Where-Object { $_.Flags -contains "Placeholder recipe" }).Count
    RecipesSafeToDelete = $safeDeleteRecords.Count
    HeldForManualReview = @($unusedRecords | Where-Object { -not $_.SafeToDelete }).Count
    MenuSlots = $menuSlots.Count
    NonblankMenuSlots = @($menuSlots | Where-Object { $_.MenuItem }).Count
    ResolvedMenuSlots = ($menuSlots.Count - @($menuSlots | Where-Object { -not $_.MenuItem }).Count)
    MasterWorkbookValidated = $true
    Outputs = $expectedOutputs
} | ConvertTo-Json -Depth 5
