$ErrorActionPreference = 'Stop'

if (-not $IsWindows -or $env:PROCESSOR_ARCHITECTURE -ne 'AMD64') {
  throw 'build-windows-desktop: run this command on 64-bit Windows'
}

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$version = '38.0.0'
$work = Join-Path $root 'apps/desktop/.desktop-build'
$output = Join-Path $root 'apps/desktop/dist'
$runtime = Join-Path $work 'runtime'
$app = Join-Path $runtime 'resources/app'
$archive = Join-Path $output 'DeepSeek-Harness-windows-x64.zip'

Remove-Item $work, $output -Recurse -Force -ErrorAction SilentlyContinue
New-Item $work, $output -ItemType Directory | Out-Null

Push-Location $root
try {
  pnpm run build
  if ($LASTEXITCODE -ne 0) { throw "build-windows-desktop: repository build exited with $LASTEXITCODE" }
  pnpm --filter '@deepseek-ai/dsh-desktop' run build
  if ($LASTEXITCODE -ne 0) { throw "build-windows-desktop: desktop build exited with $LASTEXITCODE" }
} finally {
  Pop-Location
}

$electronZip = Join-Path $work 'electron.zip'
Invoke-WebRequest "https://github.com/electron/electron/releases/download/v$version/electron-v$version-win32-x64.zip" -OutFile $electronZip
Expand-Archive $electronZip $runtime
Remove-Item $electronZip

Push-Location $root
try {
  pnpm --filter '@deepseek-ai/dsh-desktop' deploy --prod $app
  if ($LASTEXITCODE -ne 0) { throw "build-windows-desktop: deploy exited with $LASTEXITCODE" }
} finally {
  Pop-Location
}

Rename-Item (Join-Path $runtime 'electron.exe') 'DeepSeek Harness.exe'
Compress-Archive (Join-Path $runtime '*') $archive
Write-Host "build-windows-desktop: wrote $archive"
