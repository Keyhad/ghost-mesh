# GhostMesh Windows Deployment Script
# Complete build, package, and deployment automation

param(
    [string]$Version = "1.0.0",
    [switch]$Clean = $false,
    [switch]$SkipBuild = $false,
    [switch]$SkipPackage = $false,
    [ValidateSet('Development', 'Staging', 'Production')]
    [string]$Environment = 'Production'
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-ErrorMsg { Write-Host $args -ForegroundColor Red }
function Write-Step { Write-Host $args -ForegroundColor Magenta }

$ScriptRoot = Split-Path -Parent $PSCommandPath
$StartTime = Get-Date

Write-Info ""
Write-Info "===================================="
Write-Info "   GhostMesh Windows Deployment"
Write-Info "===================================="
Write-Info ""
Write-Info "Version: $Version"
Write-Info "Environment: $Environment"
Write-Info "Started: $($StartTime.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Info ""

try {
    # Step 1: Build
    if (!$SkipBuild) {
        Write-Step "=== Step 1: Building Application ==="
        $buildArgs = @()
        $buildArgs += "-Configuration"
        $buildArgs += "Release"
        if ($Clean) {
            $buildArgs += "-Clean"
        }

        & "$ScriptRoot\build.ps1" @buildArgs

        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
        Write-Success "Build completed successfully"
        Write-Info ""
    } else {
        Write-Warning "Skipping build step"
        Write-Info ""
    }

    # Step 2: Package
    if (!$SkipPackage) {
        Write-Step "=== Step 2: Creating Package ==="
        & "$ScriptRoot\package.ps1" -Version $Version -OutputName "GhostMesh-Windows"

        if ($LASTEXITCODE -ne 0) {
            throw "Packaging failed with exit code $LASTEXITCODE"
        }
        Write-Success "Package created successfully"
        Write-Info ""
    } else {
        Write-Warning "Skipping package step"
        Write-Info ""
    }

    # Step 3: Deployment summary
    Write-Step "=== Deployment Summary ==="

    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime

    Write-Info "Status: SUCCESS"
    Write-Info "Duration: $($Duration.Minutes)m $($Duration.Seconds)s"
    Write-Info "Output: platform\windows\packages\GhostMesh-Windows-v$Version.zip"
    Write-Info ""

    Write-Success "===================================="
    Write-Success "   Deployment Completed Successfully!"
    Write-Success "===================================="
    Write-Info ""

    Write-Info "Next steps:"
    Write-Info "1. Test the package: cd platform\windows\packages"
    Write-Info "2. Extract and run: .\GhostMesh.bat"
    Write-Info "3. Verify all features work correctly"
    Write-Info ""

} catch {
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime

    Write-ErrorMsg ""
    Write-ErrorMsg "===================================="
    Write-ErrorMsg "   Deployment Failed!"
    Write-ErrorMsg "===================================="
    Write-ErrorMsg ""
    Write-ErrorMsg "Error: $_"
    Write-ErrorMsg "Duration: $($Duration.Minutes)m $($Duration.Seconds)s"
    Write-ErrorMsg ""

    exit 1
}
