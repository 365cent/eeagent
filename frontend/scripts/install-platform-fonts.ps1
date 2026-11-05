$ErrorActionPreference = 'Stop'

$dest = Join-Path $PSScriptRoot '..\public\fonts' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $dest) {
  $dest = (New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot '..\public\fonts')).FullName
}

$files = @(
  'AvenirNext-Regular.woff2',
  'AvenirNext-Medium.woff2',
  'AvenirNext-DemiBold.woff2',
  'PingFangSC-Regular.woff2',
  'PingFangSC-Medium.woff2',
  'PingFangSC-Semibold.woff2'
)

$candidates = @()
if ($env:EEA_PLATFORM_FONTS_DIR) {
  $candidates += $env:EEA_PLATFORM_FONTS_DIR
}
$candidates += @(
  (Join-Path $PSScriptRoot '..\..\assets\fonts'),
  (Join-Path $PSScriptRoot '..\vendor\fonts'),
  (Join-Path $env:USERPROFILE 'Downloads\EEA-platform-fonts')
)

$source = $null
foreach ($dir in $candidates) {
  if (-not $dir -or -not (Test-Path $dir)) { continue }
  $missing = $files | Where-Object { -not (Test-Path (Join-Path $dir $_)) }
  if ($missing.Count -eq 0) {
    $source = (Resolve-Path $dir).Path
    break
  }
}

if (-not $source) {
  Write-Host "No complete font bundle found. Copy the six woff2 files into: $dest"
  Write-Host "Or set EEA_PLATFORM_FONTS_DIR to a folder that contains them."
  exit 0
}

foreach ($name in $files) {
  Copy-Item -Path (Join-Path $source $name) -Destination (Join-Path $dest $name) -Force
  Write-Host "Installed $name"
}

Write-Host "Done. Fonts in $dest"
