# GhostMesh Windows Packaging Script
# Creates a distributable package for Windows

param(
    [string]$Version = "1.0.0",
    [string]$OutputName = "GhostMesh-Windows",
    [switch]$IncludeNodeRuntime = $false,
    [switch]$CreateInstaller = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-ErrorMsg { Write-Host $args -ForegroundColor Red }

$ScriptRoot = Split-Path -Parent $PSCommandPath
$ProjectRoot = Resolve-Path "$ScriptRoot\..\.."
$OutDir = Join-Path $ProjectRoot "platform\windows\out"
$PackageDir = Join-Path $ProjectRoot "platform\windows\packages"
$PackageName = "$OutputName-v$Version"
$PackagePath = Join-Path $PackageDir $PackageName

Write-Info "==================================="
Write-Info "GhostMesh Windows Packaging"
Write-Info "==================================="
Write-Info "Version: $Version"
Write-Info "Package: $PackageName"
Write-Info ""

# Check if build output exists
if (!(Test-Path $OutDir)) {
    Write-ErrorMsg "Build output not found. Please run build.ps1 first."
    exit 1
}

# Create packages directory
Write-Info "[1/4] Preparing package directory..."
if (!(Test-Path $PackageDir)) {
    New-Item -Path $PackageDir -ItemType Directory -Force | Out-Null
}

if (Test-Path $PackagePath) {
    Remove-Item -Path $PackagePath -Recurse -Force
}
New-Item -Path $PackagePath -ItemType Directory -Force | Out-Null
Write-Success "  ✓ Package directory prepared"

# Copy build output
Write-Info "[2/4] Copying application files..."
Copy-Item -Path "$OutDir\*" -Destination $PackagePath -Recurse -Force
Write-Success "  - Application files copied"

# Create version info
Write-Info "[3/4] Creating version info..."
$arch = if ([System.Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
$VersionInfo = @{
    version = $Version
    buildDate = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    platform = "Windows"
    architecture = $arch
} | ConvertTo-Json

Set-Content -Path (Join-Path $PackagePath "version.json") -Value $VersionInfo
Write-Success "  - Version info created"

# Create launcher batch file for easier startup
$LauncherBatch = '@echo off' + "`r`n" + 'echo Starting GhostMesh...' + "`r`n" + 'powershell -ExecutionPolicy Bypass -File "%~dp0run.ps1"'

Set-Content -Path (Join-Path $PackagePath "GhostMesh.bat") -Value $LauncherBatch
Write-Success "  - Launcher created"

# Compress package
Write-Info "[4/4] Creating zip archive..."
$ZipPath = "$PackagePath.zip"
if (Test-Path $ZipPath) {
    Remove-Item -Path $ZipPath -Force
}

Compress-Archive -Path "$PackagePath\*" -DestinationPath $ZipPath -CompressionLevel Optimal
Write-Success "  ✓ Package compressed"

# Calculate package size
$PackageSize = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)

Write-Info ""
Write-Success "==================================="
Write-Success "Packaging completed successfully!"
Write-Success "==================================="
Write-Info "Package: $ZipPath"
Write-Info "Size: $PackageSize MB"
Write-Info ""
Write-Info "Distribution instructions:"
Write-Info "1. Extract the zip file"
Write-Info "2. Run install-production.ps1 to install dependencies"
Write-Info "3. Double-click GhostMesh.bat or run run.ps1"
Write-Info ""

# Create installer if requested
if ($CreateInstaller) {
    Write-Warning "Installer creation requires NSIS (Nullsoft Scriptable Install System)"
    Write-Info "Download from: https://nsis.sourceforge.io/"
    Write-Info "Installer script generation is not yet implemented."
}
