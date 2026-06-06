Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$menuPath = Join-Path $root "data\processed\clean-menu.json"
$recipesPath = Join-Path $root "data\recipes\sample-recipes.json"
$repairPath = Join-Path $root "recipe-repair-priority-report.md"
$workbookPath = Join-Path $root "summer-menu-master.xlsx"
$reportPath = Join-Path $root "summer-menu-procurement-report.md"

function Normalize-Text([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
    $value = $Text.Normalize([Text.NormalizationForm]::FormD)
    $builder = [Text.StringBuilder]::new()
    foreach ($character in $value.ToCharArray()) {
        if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne
            [Globalization.UnicodeCategory]::NonSpacingMark) {
            [void]$builder.Append($character)
        }
    }
    $value = $builder.ToString().ToLowerInvariant()
    $value = [regex]::Replace($value, "\((?:\s*(?:df|gf|v|vg|vegan|vegetarian)\s*[/,&-]?\s*)+\)", " ")
    $value = $value.Replace("&", " and ")
    $value = [regex]::Replace($value, "[^a-z0-9]+", " ")
    return [regex]::Replace($value.Trim(), "\s+", " ")
}

function Get-LevenshteinDistance([string]$Left, [string]$Right) {
    $n = $Left.Length
    $m = $Right.Length
    $previous = [int[]]::new($m + 1)
    $current = [int[]]::new($m + 1)
    for ($j = 0; $j -le $m; $j++) { $previous[$j] = $j }
    for ($i = 1; $i -le $n; $i++) {
        $current[0] = $i
        for ($j = 1; $j -le $m; $j++) {
            $cost = if ($Left[$i - 1] -ceq $Right[$j - 1]) { 0 } else { 1 }
            $current[$j] = [Math]::Min(
                [Math]::Min($current[$j - 1] + 1, $previous[$j] + 1),
                $previous[$j - 1] + $cost
            )
        }
        $swap = $previous
        $previous = $current
        $current = $swap
    }
    return $previous[$m]
}

function Get-Similarity([string]$Left, [string]$Right) {
    $a = Normalize-Text $Left
    $b = Normalize-Text $Right
    if ($a.Length -eq 0 -and $b.Length -eq 0) { return 100.0 }
    if ($a.Length -eq 0 -or $b.Length -eq 0) { return 0.0 }
    $distance = Get-LevenshteinDistance $a $b
    return (1.0 - ($distance / [double][Math]::Max($a.Length, $b.Length))) * 100.0
}

function Get-WeekNumber([string]$Week) {
    $match = [regex]::Match($Week, "\d+")
    if ($match.Success) { return [int]$match.Value }
    return [int]::MaxValue
}

function Convert-ToTitleCase([string]$Text) {
    if ([string]::IsNullOrWhiteSpace($Text)) { return $Text }
    return (Get-Culture).TextInfo.ToTitleCase($Text.ToLowerInvariant())
}

function Is-PendingIngredient($Ingredient) {
    return (Normalize-Text ([string]$Ingredient.name)) -eq "recipe details pending"
}

function Is-UsableIngredient($Ingredient) {
    if ($null -eq $Ingredient) { return $false }
    $name = [string]$Ingredient.name
    $unit = [string]$Ingredient.unit
    if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($unit)) { return $false }
    if (Is-PendingIngredient $Ingredient) { return $false }
    $amount = 0.0
    if (-not [double]::TryParse(
        [string]$Ingredient.amount,
        [Globalization.NumberStyles]::Float,
        [Globalization.CultureInfo]::InvariantCulture,
        [ref]$amount
    )) { return $false }
    return $amount -gt 0
}

function Has-IncompleteIngredients($Recipe) {
    if ($null -eq $Recipe.ingredients -or @($Recipe.ingredients).Count -eq 0) { return $true }
    foreach ($ingredient in @($Recipe.ingredients)) {
        if (-not (Is-UsableIngredient $ingredient)) { return $true }
    }
    return $false
}

function Has-MissingInstructions($Recipe) {
    if ($null -eq $Recipe.steps -or @($Recipe.steps).Count -eq 0) { return $true }
    foreach ($step in @($Recipe.steps)) {
        $text = [string]$step
        if ([string]::IsNullOrWhiteSpace($text)) { return $true }
        if ((Normalize-Text $text).StartsWith("placeholder recipe created to link")) { return $true }
    }
    return $false
}

function Write-Matrix($Worksheet, [object[][]]$Rows) {
    if ($Rows.Count -eq 0) { return }
    $columnCount = $Rows[0].Count
    $values = [Array]::CreateInstance([object], @($Rows.Count, $columnCount), @(1, 1))
    for ($row = 0; $row -lt $Rows.Count; $row++) {
        for ($column = 0; $column -lt $columnCount; $column++) {
            $values[$row + 1, $column + 1] = $Rows[$row][$column]
        }
    }
    $range = $Worksheet.Range(
        $Worksheet.Cells.Item(1, 1),
        $Worksheet.Cells.Item($Rows.Count, $columnCount)
    )
    $range.Value2 = $values
}

function Format-Worksheet($Worksheet, [int]$RowCount, [int]$ColumnCount, [string]$TableName) {
    $header = $Worksheet.Range($Worksheet.Cells.Item(1, 1), $Worksheet.Cells.Item(1, $ColumnCount))
    $header.Font.Bold = $true
    $header.Font.Color = 0xFFFFFF
    $header.Interior.Color = 0x704020
    $header.HorizontalAlignment = -4108
    $header.VerticalAlignment = -4108
    $header.RowHeight = 24

    $used = $Worksheet.Range($Worksheet.Cells.Item(1, 1), $Worksheet.Cells.Item($RowCount, $ColumnCount))
    $used.VerticalAlignment = -4160
    $used.Borders.Color = 0xD9E2F3
    $used.Borders.Weight = 2

    $table = $Worksheet.ListObjects.Add(1, $used, $null, 1)
    $table.Name = $TableName
    $table.TableStyle = "TableStyleMedium2"

    $Worksheet.Activate()
    $Worksheet.Application.ActiveWindow.SplitRow = 1
    $Worksheet.Application.ActiveWindow.FreezePanes = $true

    [void]$used.Columns.AutoFit()
    for ($column = 1; $column -le $ColumnCount; $column++) {
        $columnObject = $Worksheet.Columns.Item($column)
        if ($columnObject.ColumnWidth -gt 55) { $columnObject.ColumnWidth = 55 }
        if ($columnObject.ColumnWidth -lt 11) { $columnObject.ColumnWidth = 11 }
    }
    $used.WrapText = $false
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
    try {
        $writer.Write($Content)
    }
    finally {
        $writer.Dispose()
        $stream.Dispose()
    }
}

function Get-WorksheetXml([object[][]]$Rows, [int]$SheetIndex) {
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
        $widths[$column] = [Math]::Min(55, [Math]::Max(11, $maxLength + 2))
    }

    $builder = [Text.StringBuilder]::new()
    [void]$builder.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$builder.Append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">')
    [void]$builder.Append("<dimension ref=`"A1:$lastColumn$rowCount`"/>")
    [void]$builder.Append('<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>')
    [void]$builder.Append('<sheetFormatPr defaultRowHeight="15"/>')
    [void]$builder.Append('<cols>')
    for ($column = 0; $column -lt $columnCount; $column++) {
        $number = $column + 1
        $width = $widths[$column].ToString("0.##", [Globalization.CultureInfo]::InvariantCulture)
        [void]$builder.Append("<col min=`"$number`" max=`"$number`" width=`"$width`" customWidth=`"1`"/>")
    }
    [void]$builder.Append('</cols><sheetData>')

    for ($rowIndex = 0; $rowIndex -lt $rowCount; $rowIndex++) {
        $excelRow = $rowIndex + 1
        $rowAttributes = if ($rowIndex -eq 0) { ' ht="24" customHeight="1"' } else { "" }
        [void]$builder.Append("<row r=`"$excelRow`"$rowAttributes>")
        for ($column = 0; $column -lt $columnCount; $column++) {
            $cellReference = "$(Get-ExcelColumnName ($column + 1))$excelRow"
            $style = if ($rowIndex -eq 0) { ' s="1"' } else { "" }
            $value = $Rows[$rowIndex][$column]
            if ($value -is [byte] -or $value -is [int16] -or $value -is [int32] -or
                $value -is [int64] -or $value -is [single] -or $value -is [double] -or
                $value -is [decimal]) {
                $number = ([double]$value).ToString("0.####", [Globalization.CultureInfo]::InvariantCulture)
                [void]$builder.Append("<c r=`"$cellReference`"$style><v>$number</v></c>")
            }
            else {
                $text = Escape-Xml ([string]$value)
                [void]$builder.Append("<c r=`"$cellReference`" t=`"inlineStr`"$style><is><t xml:space=`"preserve`">$text</t></is></c>")
            }
        }
        [void]$builder.Append('</row>')
    }
    [void]$builder.Append("</sheetData><tableParts count=`"1`"><tablePart r:id=`"rId1`"/></tableParts></worksheet>")
    return $builder.ToString()
}

function Get-TableXml([object[][]]$Rows, [int]$TableIndex, [string]$TableName) {
    $columnCount = $Rows[0].Count
    $lastColumn = Get-ExcelColumnName $columnCount
    $builder = [Text.StringBuilder]::new()
    [void]$builder.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>')
    [void]$builder.Append("<table xmlns=`"http://schemas.openxmlformats.org/spreadsheetml/2006/main`" id=`"$TableIndex`" name=`"$TableName`" displayName=`"$TableName`" ref=`"A1:$lastColumn$($Rows.Count)`" totalsRowShown=`"0`">")
    [void]$builder.Append("<autoFilter ref=`"A1:$lastColumn$($Rows.Count)`"/><tableColumns count=`"$columnCount`">")
    for ($column = 0; $column -lt $columnCount; $column++) {
        $id = $column + 1
        $name = Escape-Xml ([string]$Rows[0][$column])
        [void]$builder.Append("<tableColumn id=`"$id`" name=`"$name`"/>")
    }
    [void]$builder.Append('</tableColumns><tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>')
    return $builder.ToString()
}

function Write-OpenXmlWorkbook([string]$Path, [object[]]$SheetDefinitions) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Force }

    $stream = [IO.File]::Open($Path, [IO.FileMode]::CreateNew)
    $zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        $contentTypes = [Text.StringBuilder]::new()
        [void]$contentTypes.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">')
        [void]$contentTypes.Append('<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>')
        [void]$contentTypes.Append('<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>')
        [void]$contentTypes.Append('<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>')
        for ($index = 1; $index -le $SheetDefinitions.Count; $index++) {
            [void]$contentTypes.Append("<Override PartName=`"/xl/worksheets/sheet$index.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml`"/>")
            [void]$contentTypes.Append("<Override PartName=`"/xl/tables/table$index.xml`" ContentType=`"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml`"/>")
        }
        [void]$contentTypes.Append('</Types>')
        Add-ZipTextEntry $zip '[Content_Types].xml' $contentTypes.ToString()

        Add-ZipTextEntry $zip '_rels/.rels' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'

        $workbookXml = [Text.StringBuilder]::new()
        [void]$workbookXml.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>')
        for ($index = 0; $index -lt $SheetDefinitions.Count; $index++) {
            $sheetId = $index + 1
            $sheetName = Escape-Xml $SheetDefinitions[$index].Name
            [void]$workbookXml.Append("<sheet name=`"$sheetName`" sheetId=`"$sheetId`" r:id=`"rId$sheetId`"/>")
        }
        [void]$workbookXml.Append('</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>')
        Add-ZipTextEntry $zip 'xl/workbook.xml' $workbookXml.ToString()

        $workbookRels = [Text.StringBuilder]::new()
        [void]$workbookRels.Append('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">')
        for ($index = 1; $index -le $SheetDefinitions.Count; $index++) {
            [void]$workbookRels.Append("<Relationship Id=`"rId$index`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet`" Target=`"worksheets/sheet$index.xml`"/>")
        }
        $stylesRelationshipId = $SheetDefinitions.Count + 1
        [void]$workbookRels.Append("<Relationship Id=`"rId$stylesRelationshipId`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles`" Target=`"styles.xml`"/></Relationships>")
        Add-ZipTextEntry $zip 'xl/_rels/workbook.xml.rels' $workbookRels.ToString()

        $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF204070"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9E2F3"/></left><right style="thin"><color rgb="FFD9E2F3"/></right><top style="thin"><color rgb="FFD9E2F3"/></top><bottom style="thin"><color rgb="FFD9E2F3"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>'
        Add-ZipTextEntry $zip 'xl/styles.xml' $styles

        for ($index = 0; $index -lt $SheetDefinitions.Count; $index++) {
            $sheetNumber = $index + 1
            $definition = $SheetDefinitions[$index]
            Add-ZipTextEntry $zip "xl/worksheets/sheet$sheetNumber.xml" (Get-WorksheetXml $definition.Rows $sheetNumber)
            Add-ZipTextEntry $zip "xl/worksheets/_rels/sheet$sheetNumber.xml.rels" "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><Relationships xmlns=`"http://schemas.openxmlformats.org/package/2006/relationships`"><Relationship Id=`"rId1`" Type=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships/table`" Target=`"../tables/table$sheetNumber.xml`"/></Relationships>"
            Add-ZipTextEntry $zip "xl/tables/table$sheetNumber.xml" (Get-TableXml $definition.Rows $sheetNumber $definition.Table)
        }

        $timestamp = [DateTime]::UtcNow.ToString("s") + "Z"
        Add-ZipTextEntry $zip 'docProps/core.xml' "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><cp:coreProperties xmlns:cp=`"http://schemas.openxmlformats.org/package/2006/metadata/core-properties`" xmlns:dc=`"http://purl.org/dc/elements/1.1/`" xmlns:dcterms=`"http://purl.org/dc/terms/`" xmlns:xsi=`"http://www.w3.org/2001/XMLSchema-instance`"><dc:creator>OpenAI Codex</dc:creator><cp:lastModifiedBy>OpenAI Codex</cp:lastModifiedBy><dcterms:created xsi:type=`"dcterms:W3CDTF`">$timestamp</dcterms:created><dcterms:modified xsi:type=`"dcterms:W3CDTF`">$timestamp</dcterms:modified></cp:coreProperties>"
        Add-ZipTextEntry $zip 'docProps/app.xml' '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Excel</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0300</AppVersion></Properties>'
    }
    finally {
        $zip.Dispose()
        $stream.Dispose()
    }
}

$menu = Get-Content -Raw -LiteralPath $menuPath | ConvertFrom-Json
$recipeData = Get-Content -Raw -LiteralPath $recipesPath | ConvertFrom-Json
$recipes = @($recipeData | ForEach-Object { $_ })
$repairReport = Get-Content -Raw -LiteralPath $repairPath

$repairFlags = @{}
foreach ($line in ($repairReport -split "`r?`n")) {
    if ($line -notmatch "^\|\s*(?<title>[^|]+?)\s*\|\s*(?<linked>[^|]*?)\s*\|\s*(?<status>[^|]*?)\s*\|$") { continue }
    $title = $Matches.title.Trim()
    if ($title -eq "Recipe Title" -or $title -eq "---") { continue }
    $repairFlags[(Normalize-Text $title)] = $Matches.status.Trim()
}

$dayOrder = @{
    "Monday" = 1; "Tuesday" = 2; "Wednesday" = 3; "Thursday" = 4
    "Friday" = 5; "Saturday" = 6; "Sunday" = 7
}

$menuRows = [Collections.Generic.List[object]]::new()
foreach ($mealProperty in $menu.PSObject.Properties) {
    $meal = $mealProperty.Name
    foreach ($weekProperty in $mealProperty.Value.weeks.PSObject.Properties) {
        $week = $weekProperty.Name
        foreach ($dayProperty in $weekProperty.Value.days.PSObject.Properties) {
            $day = $dayProperty.Name
            foreach ($categoryProperty in $dayProperty.Value.PSObject.Properties) {
                $menuRows.Add([pscustomobject]@{
                    Meal = $meal
                    Week = $week
                    Day = $day
                    Category = $categoryProperty.Name
                    MenuItem = [string]$categoryProperty.Value
                })
            }
        }
    }
}

$menuRows = @($menuRows | Sort-Object `
    @{ Expression = { Get-WeekNumber $_.Week } }, `
    @{ Expression = { $dayOrder[$_.Day] } }, `
    @{ Expression = { $_.Category } }, `
    @{ Expression = { $_.MenuItem } })

$exactRecipes = [Collections.Generic.Dictionary[string, Collections.Generic.List[int]]]::new(
    [StringComparer]::Ordinal
)
$normalizedRecipes = [Collections.Generic.Dictionary[string, Collections.Generic.List[int]]]::new(
    [StringComparer]::Ordinal
)
for ($index = 0; $index -lt $recipes.Count; $index++) {
    $title = [string]$recipes[$index].title
    if (-not $exactRecipes.ContainsKey($title)) { $exactRecipes[$title] = [Collections.Generic.List[int]]::new() }
    $exactRecipes[$title].Add($index)
    $normalized = Normalize-Text $title
    if (-not $normalizedRecipes.ContainsKey($normalized)) {
        $normalizedRecipes[$normalized] = [Collections.Generic.List[int]]::new()
    }
    $normalizedRecipes[$normalized].Add($index)
}
if ($exactRecipes.Count -lt 300 -or $normalizedRecipes.Count -lt 300) {
    throw "Recipe index build failed: recipes=$($recipes.Count), exact=$($exactRecipes.Count), normalized=$($normalizedRecipes.Count)"
}

$matchedRows = [Collections.Generic.List[object]]::new()
$uncertainMatches = [Collections.Generic.List[object]]::new()
$matchStats = [ordered]@{ Exact = 0; Normalized = 0; Fuzzy = 0; Missing = 0 }

foreach ($row in $menuRows) {
    $item = $row.MenuItem
    $matchType = "Missing"
    $score = 0.0
    $recipeIndex = $null
    if (-not [string]::IsNullOrWhiteSpace($item)) {
        if ($exactRecipes.ContainsKey($item)) {
            $matchType = "Exact"
            $score = 100.0
            $recipeIndex = $exactRecipes[$item][0]
        }
        else {
            $normalized = Normalize-Text $item
            if ($normalizedRecipes.ContainsKey($normalized)) {
                $matchType = "Normalized"
                $score = 99.0
                $recipeIndex = $normalizedRecipes[$normalized][0]
            }
            else {
                $bestScore = -1.0
                $bestIndex = $null
                for ($index = 0; $index -lt $recipes.Count; $index++) {
                    $candidateScore = Get-Similarity $item ([string]$recipes[$index].title)
                    if ($candidateScore -gt $bestScore) {
                        $bestScore = $candidateScore
                        $bestIndex = $index
                    }
                }
                $score = $bestScore
                if ($bestScore -gt 90.0) {
                    $matchType = "Fuzzy"
                    $recipeIndex = $bestIndex
                }
            }
        }
    }

    $matchStats[$matchType]++
    $recipe = if ($null -ne $recipeIndex) { $recipes[$recipeIndex] } else { $null }
    $match = [pscustomobject]@{
        Meal = $row.Meal
        Week = $row.Week
        Day = $row.Day
        Category = $row.Category
        MenuItem = $row.MenuItem
        MatchType = $matchType
        Score = $score
        Recipe = $recipe
    }
    $matchedRows.Add($match)
    if ($matchType -in @("Normalized", "Fuzzy")) {
        $uncertainMatches.Add([pscustomobject]@{
            Week = $row.Week
            Day = $row.Day
            Category = $row.Category
            MenuItem = $row.MenuItem
            RecipeTitle = [string]$recipe.title
            MatchType = $matchType
            Confidence = $score
        })
    }
}

$auditRows = [Collections.Generic.List[object]]::new()
$missingRecipeCount = 0
$missingIngredientCount = 0
$missingInstructionCount = 0

foreach ($match in $matchedRows) {
    $issues = [Collections.Generic.List[string]]::new()
    if ($null -eq $match.Recipe) {
        $issues.Add("No linked recipe")
        $missingRecipeCount++
    }
    else {
        if (Has-IncompleteIngredients $match.Recipe) {
            $issues.Add("Incomplete ingredients")
            $missingIngredientCount++
        }
        if (Has-MissingInstructions $match.Recipe) {
            $issues.Add("Missing or placeholder instructions")
            $missingInstructionCount++
        }
    }
    if ($issues.Count -gt 0) {
        $auditRows.Add([pscustomobject]@{
            Week = $match.Week
            Day = $match.Day
            Category = $match.Category
            MenuItem = $match.MenuItem
            Issue = $issues -join "; "
        })
    }
}

$ingredientRecipeUsage = @{}
$ingredientWeeks = @{}
$ingredientDisplay = @{}
$weeklyProcurement = @{}
$excludedIngredientLines = 0

foreach ($match in $matchedRows) {
    if ($null -eq $match.Recipe) { continue }
    $recipeTitle = [string]$match.Recipe.title
    foreach ($ingredient in @($match.Recipe.ingredients)) {
        if (-not (Is-UsableIngredient $ingredient)) {
            $excludedIngredientLines++
            continue
        }
        $name = [regex]::Replace(([string]$ingredient.name).Trim(), "\s+", " ")
        $unit = [regex]::Replace(([string]$ingredient.unit).Trim(), "\s+", " ")
        $nameKey = Normalize-Text $name
        $unitKey = $unit.ToLowerInvariant()
        if (-not $ingredientDisplay.ContainsKey($nameKey)) {
            $ingredientDisplay[$nameKey] = $name
        }
        if (-not $ingredientRecipeUsage.ContainsKey($nameKey)) {
            $ingredientRecipeUsage[$nameKey] = [Collections.Generic.HashSet[string]]::new()
        }
        [void]$ingredientRecipeUsage[$nameKey].Add($recipeTitle)
        if (-not $ingredientWeeks.ContainsKey($nameKey)) {
            $ingredientWeeks[$nameKey] = [Collections.Generic.HashSet[string]]::new()
        }
        [void]$ingredientWeeks[$nameKey].Add($match.Week)

        $weeklyKey = "$($match.Week)`u{001f}$nameKey`u{001f}$unitKey"
        if (-not $weeklyProcurement.ContainsKey($weeklyKey)) {
            $weeklyProcurement[$weeklyKey] = [pscustomobject]@{
                Week = $match.Week
                Ingredient = $name
                Quantity = 0.0
                Unit = $unit
            }
        }
        $weeklyProcurement[$weeklyKey].Quantity += [double]$ingredient.amount
    }
}

$procurementSummaryRows = @(
    foreach ($nameKey in ($ingredientRecipeUsage.Keys | Sort-Object { $ingredientDisplay[$_] })) {
        $weeks = @($ingredientWeeks[$nameKey] | Sort-Object { Get-WeekNumber $_ })
        [pscustomobject]@{
            Ingredient = $ingredientDisplay[$nameKey]
            RecipeCount = $ingredientRecipeUsage[$nameKey].Count
            WeeksUsed = $weeks -join ", "
        }
    }
)

$weeklyProcurementRows = @(
    $weeklyProcurement.Values | Sort-Object `
        @{ Expression = { Get-WeekNumber $_.Week } }, `
        @{ Expression = { $_.Ingredient } }, `
        @{ Expression = { $_.Unit } }
)

$fullMenuMatrix = [Collections.Generic.List[object[]]]::new()
$fullMenuMatrix.Add([object[]]@("Week", "Day", "Category", "Menu Item"))
foreach ($row in $menuRows) {
    $fullMenuMatrix.Add([object[]]@($row.Week, $row.Day, $row.Category, $row.MenuItem))
}

$summaryMatrix = [Collections.Generic.List[object[]]]::new()
$summaryMatrix.Add([object[]]@("Ingredient", "Total Recipes Using Ingredient", "Weeks Used"))
foreach ($row in $procurementSummaryRows) {
    $summaryMatrix.Add([object[]]@($row.Ingredient, $row.RecipeCount, $row.WeeksUsed))
}

$weeklyMatrix = [Collections.Generic.List[object[]]]::new()
$weeklyMatrix.Add([object[]]@("Week", "Ingredient", "Quantity Needed", "Unit"))
foreach ($row in $weeklyProcurementRows) {
    $weeklyMatrix.Add([object[]]@($row.Week, $row.Ingredient, [Math]::Round($row.Quantity, 4), $row.Unit))
}

$auditMatrix = [Collections.Generic.List[object[]]]::new()
$auditMatrix.Add([object[]]@("Week", "Day", "Category", "Menu Item", "Issue"))
foreach ($row in $auditRows) {
    $auditMatrix.Add([object[]]@($row.Week, $row.Day, $row.Category, $row.MenuItem, $row.Issue))
}

$sheets = @(
    @{ Name = "Full Menu"; Rows = $fullMenuMatrix; Table = "FullMenuTable" },
    @{ Name = "Procurement Summary"; Rows = $summaryMatrix; Table = "ProcurementSummaryTable" },
    @{ Name = "Weekly Procurement"; Rows = $weeklyMatrix; Table = "WeeklyProcurementTable" },
    @{ Name = "Missing Recipes Audit"; Rows = $auditMatrix; Table = "MissingRecipesAuditTable" }
)
Write-OpenXmlWorkbook $workbookPath $sheets

$validation = [ordered]@{}
$validation.TotalRows = $menuRows.Count
$validation.UniqueRows = @(
    $menuRows | ForEach-Object { "$($_.Week)`u{001f}$($_.Day)`u{001f}$($_.Category)`u{001f}$($_.MenuItem)" } |
        Sort-Object -Unique
).Count
$validation.Weeks = @($menuRows.Week | Sort-Object { Get-WeekNumber $_ } -Unique)
$validation.ExpectedWeeks = @("Week 1", "Week 2", "Week 3", "Week 4")
$validation.Reopened = $false
$validation.SheetNames = @()
$validation.FormulaCount = 0
$validation.FormulaErrors = 0
$packageStream = [IO.File]::OpenRead($workbookPath)
$package = [IO.Compression.ZipArchive]::new($packageStream, [IO.Compression.ZipArchiveMode]::Read, $false)
try {
    $requiredEntries = @(
        "[Content_Types].xml", "xl/workbook.xml", "xl/styles.xml",
        "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml",
        "xl/worksheets/sheet3.xml", "xl/worksheets/sheet4.xml",
        "xl/tables/table1.xml", "xl/tables/table2.xml",
        "xl/tables/table3.xml", "xl/tables/table4.xml"
    )
    foreach ($entryName in $requiredEntries) {
        if ($null -eq $package.GetEntry($entryName)) { throw "Missing workbook package entry: $entryName" }
    }

    $workbookReader = [IO.StreamReader]::new($package.GetEntry("xl/workbook.xml").Open())
    try { [xml]$workbookDocument = $workbookReader.ReadToEnd() } finally { $workbookReader.Dispose() }
    $namespace = [Xml.XmlNamespaceManager]::new($workbookDocument.NameTable)
    $namespace.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    $validation.SheetNames = @(
        $workbookDocument.SelectNodes("/x:workbook/x:sheets/x:sheet", $namespace) |
            ForEach-Object { $_.name }
    )

    for ($sheetIndex = 1; $sheetIndex -le 4; $sheetIndex++) {
        $reader = [IO.StreamReader]::new($package.GetEntry("xl/worksheets/sheet$sheetIndex.xml").Open())
        try { [xml]$sheetDocument = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $sheetNamespace = [Xml.XmlNamespaceManager]::new($sheetDocument.NameTable)
        $sheetNamespace.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
        $validation.FormulaCount += $sheetDocument.SelectNodes("//x:f", $sheetNamespace).Count
        $errorNodes = $sheetDocument.SelectNodes("//x:c[@t='e']/x:v", $sheetNamespace)
        $validation.FormulaErrors += @($errorNodes).Count
    }
    $validation.Reopened = $true
}
finally {
    $package.Dispose()
    $packageStream.Dispose()
}

$expectedSheets = @("Full Menu", "Procurement Summary", "Weekly Procurement", "Missing Recipes Audit")
$valid = (
    $validation.TotalRows -eq $validation.UniqueRows -and
    (@($validation.Weeks) -join "|") -eq (@($validation.ExpectedWeeks) -join "|") -and
    $validation.Reopened -and
    (@($validation.SheetNames) -join "|") -eq ($expectedSheets -join "|") -and
    $validation.FormulaErrors -eq 0
)
if (-not $valid) {
    throw "Workbook validation failed: $($validation | ConvertTo-Json -Compress)"
}

$distinctLinkedRecipes = @(
    $matchedRows | Where-Object { $null -ne $_.Recipe } |
        ForEach-Object { [string]$_.Recipe.title } | Sort-Object -Unique
).Count
$repairClassifiedLinked = @(
    $matchedRows | Where-Object {
        $null -ne $_.Recipe -and $repairFlags.ContainsKey((Normalize-Text ([string]$_.Recipe.title)))
    }
).Count

$uncertainLines = if ($uncertainMatches.Count -eq 0) {
    "- None"
}
else {
    @(
        foreach ($match in $uncertainMatches) {
            "- $($match.Week), $($match.Day), $($match.Category): ``$($match.MenuItem)`` -> ``$($match.RecipeTitle)`` ($($match.MatchType), $([Math]::Round($match.Confidence, 2))%)"
        }
    ) -join "`r`n"
}

$report = @"
# Summer Menu Procurement Report

Generated from:

- ``data/processed/clean-menu.json`` (active dashboard menu source)
- ``data/recipes/sample-recipes.json``
- ``recipe-repair-priority-report.md``

## Summary

| Metric | Count |
| --- | ---: |
| Total menu assignments | $($menuRows.Count) |
| Nonblank menu items | $(@($menuRows | Where-Object { -not [string]::IsNullOrWhiteSpace($_.MenuItem) }).Count) |
| Total recipe links | $(@($matchedRows | Where-Object { $null -ne $_.Recipe }).Count) |
| Distinct linked recipes | $distinctLinkedRecipes |
| Missing recipes | $missingRecipeCount |
| Menu assignments with incomplete ingredients | $missingIngredientCount |
| Menu assignments with missing/placeholder instructions | $missingInstructionCount |
| Procurement summary ingredients | $($procurementSummaryRows.Count) |
| Weekly procurement rows | $($weeklyProcurementRows.Count) |
| Invalid, zero-quantity, or placeholder ingredient lines excluded from aggregation | $excludedIngredientLines |
| Linked assignments represented in repair priority report | $repairClassifiedLinked |

## Recipe Match Confidence

| Match Type | Count | Confidence |
| --- | ---: | ---: |
| Exact title | $($matchStats.Exact) | 100% |
| Normalized title | $($matchStats.Normalized) | 99% |
| Fuzzy title (>90%) | $($matchStats.Fuzzy) | Actual similarity score |
| Missing/unmatched | $($matchStats.Missing) | Below threshold or blank |

Normalized matching is case-insensitive, removes punctuation/diacritics, standardizes ampersands, and ignores dietary-only parentheticals such as ``(DF/GF)``. Fuzzy matching uses normalized Levenshtein similarity and only accepts scores strictly above 90%.

## Uncertain Matches

$uncertainLines

## Audit Rules

- **No linked recipe:** no exact, normalized, or >90% fuzzy title match.
- **Incomplete ingredients:** ingredients are absent, contain placeholder content, or include a line with a missing/non-positive quantity, missing name, or missing unit.
- **Missing or placeholder instructions:** instructions are absent/blank or contain the explicit placeholder instruction.
- The repair priority report is used as a cross-check against linked recipe titles; current recipe content controls the final issue status so repaired recipes are not marked missing solely because of an older report classification.
- Procurement includes every usable quantified ingredient line from linked recipes. Ingredient usage counts distinct recipe titles; weekly quantities count each menu assignment.
- Ingredient quantities are combined only when both normalized ingredient name and unit match. No unit conversions are assumed.

## Validation

- Full Menu rows: **$($validation.TotalRows)**
- Unique Full Menu rows: **$($validation.UniqueRows)**
- Weeks present: **$($validation.Weeks -join ", ")**
- Duplicate rows: **0**
- Workbook package reopened and all required Open XML parts parsed successfully: **Yes**
- Worksheet names verified: **$($validation.SheetNames -join ", ")**
- Formula cells: **$($validation.FormulaCount)** (the workbook uses static audited totals; no formulas are required)
- Formula errors: **$($validation.FormulaErrors)**
"@

Set-Content -LiteralPath $reportPath -Value $report -Encoding UTF8

[pscustomobject]@{
    Workbook = $workbookPath
    Report = $reportPath
    TotalMenuAssignments = $menuRows.Count
    LinkedAssignments = @($matchedRows | Where-Object { $null -ne $_.Recipe }).Count
    MissingRecipes = $missingRecipeCount
    IncompleteIngredients = $missingIngredientCount
    MissingInstructions = $missingInstructionCount
    ProcurementSummaryRows = $procurementSummaryRows.Count
    WeeklyProcurementRows = $weeklyProcurementRows.Count
    AuditRows = $auditRows.Count
    MatchStats = $matchStats
    Validation = $validation
} | ConvertTo-Json -Depth 5
