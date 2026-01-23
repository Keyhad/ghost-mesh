# GhostMesh Windows Build Script
# This script builds the Next.js application and prepares it for Windows deployment

param(
    [string]$Configuration = "Release",
    [switch]$Clean = $false,
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-ErrorMsg { Write-Host $args -ForegroundColor Red }

# Script configuration
$ScriptRoot = Split-Path -Parent $PSCommandPath
$ProjectRoot = Resolve-Path "$ScriptRoot\..\.."
$BuildDir = Join-Path $ProjectRoot "dist"
$OutDir = Join-Path $ProjectRoot "platform\windows\out"

Write-Info "==================================="
Write-Info "GhostMesh Windows Build Script"
Write-Info "==================================="
Write-Info "Project Root: $ProjectRoot"
Write-Info "Configuration: $Configuration"
Write-Info ""

# Step 1: Clean previous builds
if ($Clean) {
    Write-Info "[1/6] Cleaning previous builds..."
    if (Test-Path $BuildDir) {
        Remove-Item -Path $BuildDir -Recurse -Force
        Write-Success "  - Removed build directory"
    }
    if (Test-Path $OutDir) {
        Remove-Item -Path $OutDir -Recurse -Force
        Write-Success "  - Removed output directory"
    }
    if (Test-Path (Join-Path $ProjectRoot ".next")) {
        Remove-Item -Path (Join-Path $ProjectRoot ".next") -Recurse -Force
        Write-Success "  - Removed Next.js cache"
    }
} else {
    Write-Info "[1/6] Skipping clean (use -Clean to clean previous builds)"
}

# Step 2: Install dependencies
Write-Info "[2/6] Installing dependencies..."
Push-Location $ProjectRoot
try {
    if (!(Test-Path "node_modules")) {
        npm install
        Write-Success "  - Dependencies installed"
    } else {
        Write-Success "  - Dependencies already installed"
    }
} catch {
    Write-ErrorMsg "  x Failed to install dependencies: $_"
    exit 1
} finally {
    Pop-Location
}

# Step 3: Build TypeScript server
Write-Info "[3/6] Building BLE server..."
Push-Location $ProjectRoot
try {
    npm run build:server
    Write-Success "  - BLE server built successfully"
} catch {
    Write-ErrorMsg "  x Failed to build BLE server: $_"
    exit 1
} finally {
    Pop-Location
}

# Step 4: Build Next.js application
Write-Info "[4/6] Building Next.js application..."
Push-Location $ProjectRoot
try {
    $env:NODE_ENV = "production"
    npm run build
    Write-Success "  - Next.js application built successfully"
} catch {
    Write-ErrorMsg "  x Failed to build Next.js application: $_"
    exit 1
} finally {
    Pop-Location
}

# Step 5: Copy necessary files to output directory
Write-Info "[5/6] Preparing deployment package..."
if (!(Test-Path $OutDir)) {
    New-Item -Path $OutDir -ItemType Directory -Force | Out-Null
}

$FilesToCopy = @(
    @{ Source = ".next"; Destination = ".next" }
    @{ Source = "dist"; Destination = "dist" }
    @{ Source = "public"; Destination = "public" }
    @{ Source = "node_modules"; Destination = "node_modules" }
    @{ Source = "package.json"; Destination = "package.json" }
    @{ Source = "next.config.js"; Destination = "next.config.js" }
)

foreach ($file in $FilesToCopy) {
    $sourcePath = Join-Path $ProjectRoot $file.Source
    $destPath = Join-Path $OutDir $file.Destination

    if (Test-Path $sourcePath) {
        if (Test-Path $destPath) {
            Remove-Item -Path $destPath -Recurse -Force
        }
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        Write-Success "  - Copied $($file.Source)"
    } else {
        Write-Warning "  ! Skipped $($file.Source) (not found)"
    }
}

# Step 6: Create startup scripts
Write-Info "[6/6] Creating startup scripts..."

# Create run.ps1
$RunScript = @"
# GhostMesh Startup Script
`$ErrorActionPreference = "Stop"

Write-Host "Starting GhostMesh..." -ForegroundColor Cyan

# Start BLE server in background
Write-Host "Starting BLE Server..." -ForegroundColor Yellow
`$bleServer = Start-Process powershell -ArgumentList "-NoExit", "-Command", "node dist/server/ble-server.js" -PassThru -WindowStyle Minimized

# Wait for server to initialize
Start-Sleep -Seconds 2

# Start Next.js application
Write-Host "Starting Web Application..." -ForegroundColor Yellow
`$webapp = Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -PassThru

Write-Host ""
Write-Host "GhostMesh is running!" -ForegroundColor Green
Write-Host "Web UI: http://localhost:3000" -ForegroundColor Cyan
Write-Host "BLE Server: ws://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

try {
    while (`$true) {
        Start-Sleep -Seconds 1
        if (`$bleServer.HasExited -or `$webapp.HasExited) {
            Write-Host "One of the services has stopped. Shutting down..." -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Process -Id `$bleServer.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id `$webapp.Id -Force -ErrorAction SilentlyContinue
    Write-Host "GhostMesh stopped." -ForegroundColor Green
}
"@

Set-Content -Path (Join-Path $OutDir "run.ps1") -Value $RunScript
Write-Success "  - Created run.ps1"

# Create install-production.ps1 (for reference only - dependencies are bundled)
$InstallScript = @"
# GhostMesh Production Dependencies
# Note: Dependencies are already included in this package.
# This script is provided for reference only.
Write-Host "Dependencies are already bundled with this package." -ForegroundColor Green
Write-Host "No installation needed. You can run the application directly." -ForegroundColor Cyan
"@

Set-Content -Path (Join-Path $OutDir "install-production.ps1") -Value $InstallScript
Write-Success "  - Created install-production.ps1"

# Create README
$ReadmeContent = @"
# GhostMesh Windows Deployment

## Installation

1. Dependencies are already bundled - no installation needed!all-production.ps1
   ``````

## Running

Run the application using:
``````powershell
.\run.ps1
``````

This will start:
- BLE Server on port 8080
- Web Application on port 3000

Access the application at: http://localhost:3000

## Requirements

- Windows 10/11
- Node.js v18+
- Bluetooth Low Energy (BLE) adapter

## Configuration

Set the log level before running:
``````powershell
`$env:LOG_LEVEL="info"
.\run.ps1
``````

Available log levels: DEBUG, INFO, WARN, ERROR, SILENT

## Troubleshooting

### BLE Server fails to start
- Ensure you have a Bluetooth adapter
- Check if another application is using port 8080

### Web app fails to start
- Check if port 3000 is available
- Verify Node.js is installed correctly

## Support

For issues, please visit: https://github.com/Keyhad/ghost-mesh
"@

Set-Content -Path (Join-Path $OutDir "README.md") -Value $ReadmeContent
Write-Success "  - Created README.md"

Write-Info ""
Write-Success "==================================="
Write-Success "Build completed successfully!"
Write-Success "==================================="
Write-Info "Output directory: $OutDir"
Write-Info ""
Write-Info "Next steps:"
Write-Info "1. Navigate to: cd platform\windows\out"
Write-Info "2. Run application: .\run.ps1"
Write-Info ""
Write-Info "Note: Dependencies are bundled (node_modules included)"
Write-Info ""