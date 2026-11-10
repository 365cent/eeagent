# Build a Windows release: binary + zip (README/config) + SHA256SUMS.
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/release.ps1 -Version v0.1.0
# Requires Go >= 1.24 (windigo uses unicode/utf16.RuneLen).
param(
    [string]$Version = "v0.1.0",
    [string]$Go = "go"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$pkg = Join-Path $dist "pkg"
$zip = Join-Path $dist "capture-$Version-windows-amd64.zip"

New-Item -ItemType Directory -Force -Path $dist | Out-Null
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $pkg
New-Item -ItemType Directory -Force -Path $pkg | Out-Null

Push-Location $root
try {
    & $Go build -trimpath -ldflags "-s -w -H=windowsgui -X main.version=$Version" `
        -o (Join-Path $dist "capture.exe") ./cmd/capture
    if ($LASTEXITCODE -ne 0) { throw "go build failed ($LASTEXITCODE)" }

    Copy-Item README.md, config.example.json -Destination $pkg
    Copy-Item (Join-Path $dist "capture.exe") -Destination $pkg
    $bundledExt = Join-Path $root "data\extensions\singlefile"
    if (Test-Path (Join-Path $bundledExt "manifest.json")) {
        $extDest = Join-Path $pkg "data\extensions\singlefile"
        New-Item -ItemType Directory -Force -Path (Split-Path $extDest) | Out-Null
        Copy-Item -Recurse -Force $bundledExt $extDest
        Write-Host "bundled SingleFile -> data/extensions/singlefile"
    } else {
        Write-Warning "client/data/extensions/singlefile missing — run 'capture doctor' once with network to stage, then rebuild release"
    }
    if (Test-Path $zip) { Remove-Item -Force $zip }
    Compress-Archive -Path (Join-Path $pkg "*") -DestinationPath $zip -CompressionLevel Optimal
} finally {
    Pop-Location
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $pkg
}

$hashes = @(
    (Get-FileHash (Join-Path $dist "capture.exe") -Algorithm SHA256),
    (Get-FileHash $zip -Algorithm SHA256)
) | ForEach-Object { "$($_.Hash.ToLower())  $(Split-Path $_.Path -Leaf)" }
# LF + ASCII: sha256sum on Git Bash treats CR as part of the filename.
$checksumFile = Join-Path $dist "SHA256SUMS"
[System.IO.File]::WriteAllText($checksumFile, (($hashes -join "`n") + "`n"), [System.Text.Encoding]::ASCII)

Write-Host "release $Version -> $dist"
Get-ChildItem $dist | Select-Object Name, Length | Format-Table -AutoSize
