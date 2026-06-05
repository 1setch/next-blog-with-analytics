# collect-code.ps1 - Упрощенная версия
$outputFile = "project-code.txt"
$projectRoot = "."

# Очищаем
if (Test-Path $outputFile) { Remove-Item $outputFile }

# Заголовок
"=== PROJECT CODE DUMP ===" | Out-File $outputFile -Encoding UTF8
"Generated: $(Get-Date)" | Out-File $outputFile -Append -Encoding UTF8
"" | Out-File $outputFile -Append -Encoding UTF8

# Получаем все файлы
$allFiles = Get-ChildItem -Recurse -File -Include "*.ts", "*.tsx", "*.js", "*.jsx", "*.css", "*.json" -Exclude "*.lock", "*.map" |
    Where-Object { 
        $_.DirectoryName -notlike "*node_modules*" -and 
        $_.DirectoryName -notlike "*.next*" -and
        $_.Name -ne "package-lock.json"
    }

foreach ($file in $allFiles) {
    "=" * 80 | Out-File $outputFile -Append -Encoding UTF8
    "FILE: $($file.FullName)" | Out-File $outputFile -Append -Encoding UTF8
    "=" * 80 | Out-File $outputFile -Append -Encoding UTF8
    
    try {
        Get-Content $file.FullName -ErrorAction Stop | Out-File $outputFile -Append -Encoding UTF8
    } catch {
        "ERROR: $_" | Out-File $outputFile -Append -Encoding UTF8
    }
    "" | Out-File $outputFile -Append -Encoding UTF8
}

Write-Host "Done! File saved: $outputFile" -ForegroundColor Green