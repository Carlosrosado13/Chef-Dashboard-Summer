param(
    [Parameter(Mandatory = $true)]
    [string]$WorkbookPath
)

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-ZipXml {
    param(
        [System.IO.Compression.ZipArchive]$Archive,
        [string]$EntryName
    )

    $entry = $Archive.GetEntry($EntryName)
    if (-not $entry) {
        throw "Workbook entry is missing: $EntryName"
    }

    $reader = [System.IO.StreamReader]::new($entry.Open())
    try {
        return [xml]$reader.ReadToEnd()
    }
    finally {
        $reader.Dispose()
    }
}

$archive = [System.IO.Compression.ZipFile]::OpenRead(
    [System.IO.Path]::GetFullPath($WorkbookPath)
)

try {
    $sharedStringsXml = Read-ZipXml $archive "xl/sharedStrings.xml"
    $sharedNs = [System.Xml.XmlNamespaceManager]::new($sharedStringsXml.NameTable)
    $sharedNs.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")
    $sharedStrings = @(
        $sharedStringsXml.SelectNodes("//x:si", $sharedNs) | ForEach-Object {
            (
                $_.SelectNodes(".//x:t", $sharedNs) |
                    ForEach-Object { $_.InnerText }
            ) -join ""
        }
    )

    $sheetXml = Read-ZipXml $archive "xl/worksheets/sheet1.xml"
    $sheetNs = [System.Xml.XmlNamespaceManager]::new($sheetXml.NameTable)
    $sheetNs.AddNamespace("x", "http://schemas.openxmlformats.org/spreadsheetml/2006/main")

    $rows = foreach ($row in $sheetXml.SelectNodes("//x:sheetData/x:row", $sheetNs)) {
        $values = @{}

        foreach ($cell in $row.SelectNodes("x:c", $sheetNs)) {
            $column = [regex]::Match($cell.r, "^[A-Z]+").Value
            $valueNode = $cell.SelectSingleNode("x:v", $sheetNs)
            $rawValue = if ($valueNode) { $valueNode.InnerText } else { "" }

            if ($cell.t -eq "s" -and $rawValue -ne "") {
                $values[$column] = $sharedStrings[[int]$rawValue]
            }
            elseif ($cell.t -eq "inlineStr") {
                $values[$column] = (
                    $cell.SelectNodes(".//x:t", $sheetNs) |
                        ForEach-Object { $_.InnerText }
                ) -join ""
            }
            else {
                $values[$column] = $rawValue
            }
        }

        if ([int]$row.r -gt 1) {
            [pscustomobject]@{
                Row = [int]$row.r
                Week = [string]$values["A"]
                Day = [string]$values["B"]
                Category = [string]$values["C"]
                MenuItem = [string]$values["D"]
                RecipeAssignment = [string]$values["E"]
                Servings = [string]$values["F"]
            }
        }
    }

    $rows | ConvertTo-Json -Depth 5 -Compress
}
finally {
    $archive.Dispose()
}
