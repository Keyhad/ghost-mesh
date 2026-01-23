# GhostMesh Electron Build Script
param(
    [string]$Version = "1.0.0",
    [switch]$Clean = $false,
    [switch]$Portable = $false
)

$ErrorActionPreference = "Stop"

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-ErrorMsg { Write-Host $args -ForegroundColor Red }

$ScriptRoot = Split-Path -Parent $PSCommandPath
$ProjectRoot = Resolve-Path "$ScriptRoot\..\..\..\"
$ElectronRoot = $ScriptRoot

Write-Info ""
Write-Info "===================================="
Write-Info "   GhostMesh Electron Build"
Write-Info "===================================="
Write-Info "Version: $Version"
Write-Info "Project Root: $ProjectRoot"
Write-Info ""

# Clean if requested
if ($Clean) {
    Write-Info "[1/6] Cleaning previous builds..."
    if (Test-Path "$ElectronRoot\dist") {
        Remove-Item "$ElectronRoot\dist" -Recurse -Force
        Write-Success "  - Cleaned electron dist"
    }
    if (Test-Path "$ElectronRoot\node_modules") {
        Remove-Item "$ElectronRoot\node_modules" -Recurse -Force
        Write-Success "  - Cleaned electron node_modules"
    }
}

# Install electron dependencies
Write-Info "[2/6] Installing Electron dependencies..."
Push-Location $ElectronRoot
try {
    npm install
    Write-Success "  - Electron dependencies installed"
} catch {
    Write-ErrorMsg "  x Failed to install Electron dependencies"
    exit 1
} finally {
    Pop-Location
}

# Build main project
Write-Info "[3/6] Building main project..."
Push-Location $ProjectRoot
try {
    # Build TypeScript server
    npm run build:server
    Write-Success "  - BLE server built"

    # Build Next.js
    $env:NODE_ENV = "production"
    npm run build
    Write-Success "  - Next.js built"
} catch {
    Write-ErrorMsg "  x Failed to build main project"
    exit 1
} finally {
    Pop-Location
}

# Create icon if it doesn't exist
Write-Info "[4/6] Checking for application icon..."
$iconPath = Join-Path $ProjectRoot "public\icon.ico"
if (!(Test-Path $iconPath)) {
    Write-Info "  - Icon not found, will use default"
} else {
    Write-Success "  - Icon found"
}

# Update version in package.json
Write-Info "[5/6] Updating version..."
$packagePath = Join-Path $ElectronRoot "package.json"
$package = Get-Content $packagePath -Raw | ConvertFrom-Json
$package.version = $Version
$package | ConvertTo-Json -Depth 10 | Set-Content $packagePath
Write-Success "  - Version updated to $Version"

# Build Electron app
Write-Info "[6/6] Building Electron application..."
Push-Location $ElectronRoot
try {
    if ($Portable) {
        npm run build:portable
        if ($LASTEXITCODE -ne 0) {
            throw "build:portable failed with exit code $LASTEXITCODE"
        }
        Write-Success "  - Portable executable created"
    } else {
        npm run build:installer
        if ($LASTEXITCODE -ne 0) {
            throw "build:installer failed with exit code $LASTEXITCODE"
        }
        Write-Success "  - Installer created"
    }
} catch {
    Write-ErrorMsg "  x Failed to build Electron application"
    Write-ErrorMsg "  x $($_.Exception.Message)"
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

Write-Info ""
Write-Success "===================================="
Write-Success "Build completed successfully!"
Write-Success "===================================="
Write-Info "Output: $ElectronRoot\dist"
Write-Info ""

# List output files
$distFiles = Get-ChildItem "$ElectronRoot\dist" -Filter "*.exe" -ErrorAction SilentlyContinue
if ($distFiles) {
    Write-Info "Created files:"
    foreach ($file in $distFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Info "  - $($file.Name) ($sizeMB MB)"
    }
}
Write-Info ""
