# GhostMesh Windows Development Environment Check
# This script verifies all prerequisites are met before starting development

$ErrorActionPreference = "Continue"

# Counters
$CHECKS_PASSED = 0
$CHECKS_FAILED = 0
$WARNINGS = 0

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "GhostMesh Windows Environment Check" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Windows Version
Write-Host ""
Write-Host "[1/10] Checking Windows Version..." -ForegroundColor Cyan
try {
    $WIN_VERSION = [System.Environment]::OSVersion.VersionString
    Write-Host "✓ Windows version: $WIN_VERSION" -ForegroundColor Green
    $CHECKS_PASSED++
} catch {
    Write-Host "✗ Cannot detect Windows version" -ForegroundColor Red
    Write-Host "ℹ This script requires PowerShell 5.1 or higher." -ForegroundColor Cyan
    $CHECKS_FAILED++
}

# Check 2: Package Manager (Chocolatey)
Write-Host ""
Write-Host "[2/10] Checking Package Manager..." -ForegroundColor Cyan

if (Get-Command choco -ErrorAction SilentlyContinue) {
    $CHOCO_VERSION = (choco --version 2>$null) | Select-Object -First 1
    Write-Host "✓ Chocolatey $CHOCO_VERSION installed" -ForegroundColor Green
    $CHECKS_PASSED++
} else {
    Write-Host "✗ Chocolatey not installed" -ForegroundColor Red
    Write-Host "ℹ Chocolatey is required to install dependencies." -ForegroundColor Cyan
    Write-Host "ℹ Install with PowerShell (Run as Administrator):" -ForegroundColor Cyan
    Write-Host "ℹ   Set-ExecutionPolicy Bypass -Scope Process -Force;" -ForegroundColor Cyan
    Write-Host "ℹ   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;" -ForegroundColor Cyan
    Write-Host "ℹ   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" -ForegroundColor Cyan
    $CHECKS_FAILED++
}

# Check 3: Node.js
Write-Host ""
Write-Host "[3/10] Checking Node.js..." -ForegroundColor Cyan
if (Get-Command node -ErrorAction SilentlyContinue) {
    $NODE_VERSION = (node --version)
    $NODE_MAJOR = $NODE_VERSION.Split('.')[0].Substring(1)

    if ([int]$NODE_MAJOR -ge 18) {
        Write-Host "✓ Node.js $NODE_VERSION (>= 18.x required)" -ForegroundColor Green
        $CHECKS_PASSED++
    } else {
        Write-Host "⚠ Node.js $NODE_VERSION (v18.x or higher recommended)" -ForegroundColor Yellow
        Write-Host "ℹ Your Node.js version is outdated. Upgrade with:" -ForegroundColor Cyan
        Write-Host "ℹ   choco upgrade nodejs -y" -ForegroundColor Cyan
        $WARNINGS++
    }

    # Check architecture
    $NODE_ARCH = (node -p "process.arch")
    $SYSTEM_ARCH = $env:PROCESSOR_ARCHITECTURE
    if ($NODE_ARCH -eq "x64" -and $SYSTEM_ARCH -eq "AMD64") {
        Write-Host "✓ Native x64 Node.js" -ForegroundColor Green
        $CHECKS_PASSED++
    } elseif ($NODE_ARCH -eq "ia32" -and $SYSTEM_ARCH -eq "x86") {
        Write-Host "✓ Native x86 Node.js" -ForegroundColor Green
        $CHECKS_PASSED++
    } else {
        Write-Host "⚠ Node.js architecture ($NODE_ARCH) may not match system ($SYSTEM_ARCH)" -ForegroundColor Yellow
        $WARNINGS++
    }
} else {
    Write-Host "✗ Node.js not installed" -ForegroundColor Red
    Write-Host "ℹ Install Node.js (LTS) with:" -ForegroundColor Cyan
    Write-Host "ℹ   choco install nodejs-lts -y" -ForegroundColor Cyan
    $CHECKS_FAILED++
}

# Check 4: npm
Write-Host ""
Write-Host "[4/10] Checking npm..." -ForegroundColor Cyan
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $NPM_VERSION = (npm --version)
    Write-Host "✓ npm $NPM_VERSION installed" -ForegroundColor Green
    $CHECKS_PASSED++
} else {
    Write-Host "✗ npm not installed" -ForegroundColor Red
    Write-Host "ℹ npm is included with Node.js. If Node.js is installed, check your PATH." -ForegroundColor Cyan
    $CHECKS_FAILED++
}

# Check 5: Yarn
Write-Host ""
Write-Host "[5/10] Checking Yarn..." -ForegroundColor Cyan
if (Get-Command yarn -ErrorAction SilentlyContinue) {
    $YARN_VERSION = (yarn --version)
    Write-Host "✓ Yarn $YARN_VERSION installed" -ForegroundColor Green
    $CHECKS_PASSED++
} else {
    Write-Host "⚠ Yarn not installed" -ForegroundColor Yellow
    Write-Host "ℹ Yarn is recommended for dependency management." -ForegroundColor Cyan
    Write-Host "ℹ Install with:" -ForegroundColor Cyan
    Write-Host "ℹ   npm install -g yarn" -ForegroundColor Cyan
    $WARNINGS++
}

# Check 6: Git
Write-Host ""
Write-Host "[6/10] Checking Git..." -ForegroundColor Cyan
if (Get-Command git -ErrorAction SilentlyContinue) {
    $GIT_VERSION = (git --version)
    Write-Host "✓ $GIT_VERSION installed" -ForegroundColor Green
    $CHECKS_PASSED++
} else {
    Write-Host "✗ Git not installed" -ForegroundColor Red
    Write-Host "ℹ Git is required for version control." -ForegroundColor Cyan
    Write-Host "ℹ Install with:" -ForegroundColor Cyan
    Write-Host "ℹ   choco install git -y" -ForegroundColor Cyan
    $CHECKS_FAILED++
}

# Check 7: Windows Build Tools
Write-Host ""
Write-Host "[7/10] Checking Windows Build Tools..." -ForegroundColor Cyan
try {
    $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $vswhere) {
        # Check for C++ Build Tools specifically
        $vs_path = & $vswhere -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
        if ($vs_path) {
            Write-Host "✓ Visual Studio with C++ Build Tools found." -ForegroundColor Green
            $CHECKS_PASSED++
        } else {
            throw "C++ Build Tools not found"
        }
    } else {
        throw "vswhere not found"
    }
} catch {
    Write-Host "✗ Visual Studio C++ Build Tools not found." -ForegroundColor Red
    Write-Host "ℹ Required for building native Node.js modules." -ForegroundColor Cyan
    Write-Host "ℹ Install with Chocolatey (Run as Administrator):" -ForegroundColor Cyan
    Write-Host "ℹ   choco install visualstudio2022buildtools --package-parameters `"--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended`" -y" -ForegroundColor Cyan
    Write-Host "ℹ Or modify existing VS installation:" -ForegroundColor Cyan
    Write-Host "ℹ   Open Visual Studio Installer -> Modify -> Check 'Desktop development with C++'" -ForegroundColor Cyan
    $CHECKS_FAILED++
}

# Check 8: Visual Studio Code
Write-Host ""
Write-Host "[8/10] Checking Visual Studio Code..." -ForegroundColor Cyan
if (Get-Command code -ErrorAction SilentlyContinue) {
    Write-Host "✓ Visual Studio Code is installed." -ForegroundColor Green
    $CHECKS_PASSED++
} else {
    Write-Host "⚠ Visual Studio Code not found in PATH." -ForegroundColor Yellow
    Write-Host "ℹ VS Code is the recommended editor." -ForegroundColor Cyan
    Write-Host "ℹ Install with:" -ForegroundColor Cyan
    Write-Host "ℹ   choco install vscode -y" -ForegroundColor Cyan
    $WARNINGS++
}

# Check 9: node-gyp
Write-Host ""
Write-Host "[9/10] Checking node-gyp..." -ForegroundColor Cyan
if (Get-Command node-gyp -ErrorAction SilentlyContinue) {
    $NODE_GYP_VERSION = (node-gyp --version)
    Write-Host "✓ node-gyp $NODE_GYP_VERSION installed" -ForegroundColor Green
    $CHECKS_PASSED++
} else {
    Write-Host "⚠ node-gyp not installed globally" -ForegroundColor Yellow
    Write-Host "ℹ node-gyp is used to compile native addon modules for Node.js." -ForegroundColor Cyan
    Write-Host "ℹ Install with:" -ForegroundColor Cyan
    Write-Host "ℹ   npm install -g node-gyp" -ForegroundColor Cyan
    $WARNINGS++
}

# Check 10: Python
Write-Host ""
Write-Host "[10/10] Checking Python..." -ForegroundColor Cyan
if (Get-Command python -ErrorAction SilentlyContinue) {
    $PYTHON_VERSION = (python --version)
    Write-Host "✓ Python detected: $PYTHON_VERSION" -ForegroundColor Green
    $CHECKS_PASSED++
} else {
    Write-Host "⚠ Python not found in PATH" -ForegroundColor Yellow
    Write-Host "ℹ Python is required by node-gyp." -ForegroundColor Cyan
    Write-Host "ℹ Install with:" -ForegroundColor Cyan
    Write-Host "ℹ   choco install python -y" -ForegroundColor Cyan
    $WARNINGS++
}

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Check Summary:" -ForegroundColor Cyan
Write-Host "  Passed: $CHECKS_PASSED" -ForegroundColor Green
Write-Host "  Failed: $CHECKS_FAILED" -ForegroundColor Red
Write-Host "  Warnings: $WARNINGS" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Quick Fix Guide
if ($CHECKS_FAILED -gt 0 -or $WARNINGS -gt 0) {
    Write-Host "======================================" -ForegroundColor Yellow
    Write-Host "QUICK FIX GUIDE" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Yellow
    Write-Host ""

    if ($CHECKS_FAILED -gt 0) {
        Write-Host "Required installations:" -ForegroundColor Red
        Write-Host ""

        # Check what's missing and build fix command
        $fixCommands = @()

        if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
            Write-Host "  1. Install Chocolatey (Run PowerShell as Administrator):" -ForegroundColor Cyan
            Write-Host "     Set-ExecutionPolicy Bypass -Scope Process -Force;" -ForegroundColor White
            Write-Host "     [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072;" -ForegroundColor White
            Write-Host "     iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" -ForegroundColor White
            Write-Host ""
        }

        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            $fixCommands += "choco install nodejs-lts -y"
        }

        if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
            $fixCommands += "choco install git -y"
        }

        # Check for VS C++ Build Tools
        $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
        $hasCppTools = $false
        if (Test-Path $vswhere) {
            $vs_path = & $vswhere -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
            if ($vs_path) {
                $hasCppTools = $true
            }
        }

        if (-not $hasCppTools) {
            $fixCommands += "choco install visualstudio2022-workload-vctools -y"
        }

        if ($fixCommands.Count -gt 0) {
            $stepNum = if (-not (Get-Command choco -ErrorAction SilentlyContinue)) { "2" } else { "1" }
            Write-Host "  $stepNum. Install missing packages (Run PowerShell as Administrator):" -ForegroundColor Cyan
            Write-Host "     $($fixCommands -join ' && ')" -ForegroundColor White
            Write-Host ""
        }
    }

    if ($WARNINGS -gt 0) {
        Write-Host "Optional (but recommended):" -ForegroundColor Yellow
        Write-Host ""

        $optionalCommands = @()

        if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
            $optionalCommands += "npm install -g yarn"
        }

        if (-not (Get-Command node-gyp -ErrorAction SilentlyContinue)) {
            $optionalCommands += "npm install -g node-gyp"
        }

        if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
            Write-Host "  Install Python (Run PowerShell as Administrator):" -ForegroundColor Cyan
            Write-Host "     choco install python -y" -ForegroundColor White
            Write-Host ""
        }

        if ($optionalCommands.Count -gt 0) {
            Write-Host "  Install optional tools (Run after Node.js is installed):" -ForegroundColor Cyan
            foreach ($cmd in $optionalCommands) {
                Write-Host "     $cmd" -ForegroundColor White
            }
            Write-Host ""
        }
    }

    Write-Host "After installing, restart PowerShell and run this script again." -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Yellow
    Write-Host ""
}

if ($CHECKS_FAILED -gt 0) {
    Write-Host "ℹ Please address the failed checks before proceeding." -ForegroundColor Cyan
    exit 1
} elseif ($WARNINGS -gt 0) {
    Write-Host "ℹ Please review the warnings. They might cause issues later." -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "✓ Your Windows development environment is ready for GhostMesh!" -ForegroundColor Green
    exit 0
}

