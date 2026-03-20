Add-Type -AssemblyName System.IO.Compression.FileSystem

$docDir = 'D:\1_HR Cloud\HR-Cloud\Document'
$files = Get-ChildItem $docDir -Filter "*.docx"

foreach ($f in $files) {
    Write-Output ("=== " + $f.Name + " ===")
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
        $entry = $zip.GetEntry('word/document.xml')
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        $xml = $reader.ReadToEnd()
        $reader.Close()
        $zip.Dispose()
        $text = $xml -replace '<[^>]+>', ' '
        $text = $text -replace '\s+', ' '
        Write-Output $text.Trim()
    } catch {
        Write-Output ("Error: " + $_.Exception.Message)
    }
    Write-Output ""
}
