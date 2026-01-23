# GhostMesh Windows Deployment

This directory contains scripts for building, packaging, and deploying GhostMesh as a Windows desktop application.

## Prerequisites

- **Windows 10/11**: 64-bit operating system
- **PowerShell 5.1+**: Built into Windows
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **Bluetooth Adapter**: For BLE functionality
- **Git**: For version control (optional)

## Quick Start

### Complete Deployment

Run the complete deployment process:

```powershell
.\deploy.ps1 -Version "1.0.0" -Clean
```

This will:
1. Clean previous builds
2. Build the application
3. Create a distributable package

### Step-by-Step Deployment

#### 1. Build Only

```powershell
.\build.ps1 -Clean
```

Options:
- `-Clean`: Remove previous builds
- `-Configuration Release|Debug`: Build configuration
- `-SkipTests`: Skip running tests
- `-Verbose`: Enable verbose logging

#### 2. Package Only

```powershell
.\package.ps1 -Version "1.0.0"
```

Options:
- `-Version`: Version number (default: 1.0.0)
- `-OutputName`: Package name (default: GhostMesh-Windows)
- `-IncludeNodeRuntime`: Bundle Node.js runtime (experimental)
- `-CreateInstaller`: Generate installer (requires NSIS)

## Output Structure

```
platform/windows/
├── out/                      # Build output
│   ├── .next/               # Next.js build
│   ├── dist/                # Compiled TypeScript
│   ├── public/              # Static assets
│   ├── package.json         # Dependencies
│   ├── run.ps1              # Startup script
│   ├── install-production.ps1
│   └── README.md
│
└── packages/                # Distribution packages
    └── GhostMesh-Windows-v1.0.0/
        └── GhostMesh-Windows-v1.0.0.zip
```

## Deployment Scripts

### build.ps1

Builds the Next.js application and BLE server.

**Usage:**
```powershell
.\build.ps1 [-Clean] [-Configuration <Release|Debug>] [-Verbose]
```

**Features:**
- Installs dependencies
- Compiles TypeScript server
- Builds Next.js application
- Creates startup scripts
- Prepares deployment files

### package.ps1

Creates a distributable package.

**Usage:**
```powershell
.\package.ps1 [-Version <version>] [-OutputName <name>]
```

**Features:**
- Compresses build output
- Creates launcher scripts
- Generates version info
- Calculates package size

### deploy.ps1

Complete deployment automation (build + package).

**Usage:**
```powershell
.\deploy.ps1 [-Version <version>] [-Clean] [-Environment <Development|Staging|Production>]
```

**Features:**
- Orchestrates full deployment
- Provides detailed progress
- Error handling and rollback
- Deployment summary

## Distribution

### Package Contents

The distribution package includes:
- **Next.js Application**: Web-based UI
- **BLE Server**: Bluetooth Low Energy server
- **Startup Scripts**: Automated service management
- **Documentation**: Setup and usage guides

### Installation for End Users

1. **Extract Package**
   ```powershell
   Expand-Archive -Path GhostMesh-Windows-v1.0.0.zip -DestinationPath C:\GhostMesh
   cd C:\GhostMesh
   ```

2. **Install Dependencies**
   ```powershell
   .\install-production.ps1
   ```

3. **Run Application**
   ```powershell
   # Option 1: Double-click GhostMesh.bat
   # Option 2: Run PowerShell script
   .\run.ps1
   ```

4. **Access Application**
   - Open browser to: http://localhost:3000
   - BLE Server runs on: ws://localhost:8080

## Configuration

### Environment Variables

Set before running:

```powershell
# Log level
$env:LOG_LEVEL = "info"  # DEBUG, INFO, WARN, ERROR, SILENT

# Server ports
$env:BLE_SERVER_PORT = "8080"
$env:WEB_PORT = "3000"

# Run application
.\run.ps1
```

### Production Configuration

For production deployments:

```powershell
$env:NODE_ENV = "production"
$env:LOG_LEVEL = "warn"
```

## Troubleshooting

### Build Issues

**Problem**: Dependencies fail to install
```powershell
# Solution: Clear npm cache
npm cache clean --force
rm -r node_modules
npm install
```

**Problem**: TypeScript compilation errors
```powershell
# Solution: Clean build directory
.\build.ps1 -Clean
```

### Runtime Issues

**Problem**: BLE Server fails to start
- Ensure Bluetooth adapter is connected
- Check if port 8080 is available
- Run as Administrator if needed

**Problem**: Web app won't start
- Verify Node.js installation: `node --version`
- Check port 3000 availability
- Review logs in PowerShell window

### Package Issues

**Problem**: Package too large
- Remove `node_modules` before packaging
- Users install dependencies on their machines
- Consider using `--omit=dev` flag

## Advanced Usage

### Custom Build Configuration

Create a build configuration file:

```powershell
# build.config.ps1
$BuildConfig = @{
    CleanBuild = $true
    Configuration = "Release"
    Verbose = $false
    SkipTests = $false
}

.\build.ps1 @BuildConfig
```

### Automated Deployment Pipeline

```powershell
# deploy-pipeline.ps1
$Version = "1.0.0"

# Build
.\deploy.ps1 -Version $Version -Clean -Environment Production

# Test package
$PackagePath = "packages\GhostMesh-Windows-v$Version"
Expand-Archive "$PackagePath.zip" -DestinationPath "test-deploy"
cd test-deploy
.\install-production.ps1

# Upload to distribution server
# (Add your upload logic here)
```

### Creating System Service

To run GhostMesh as a Windows service, use NSSM (Non-Sucking Service Manager):

```powershell
# Download NSSM from https://nssm.cc/
nssm install GhostMesh "C:\GhostMesh\run.ps1"
nssm set GhostMesh AppDirectory "C:\GhostMesh"
nssm start GhostMesh
```

## Security Considerations

- **Firewall Rules**: Add exceptions for ports 3000 and 8080
- **Bluetooth Permissions**: May require Administrator privileges
- **Network Access**: Consider restricting to localhost
- **Updates**: Implement secure update mechanism

## Future Enhancements

- [ ] Electron wrapper for true desktop app
- [ ] Auto-updater integration
- [ ] Windows Store distribution
- [ ] MSI installer generation
- [ ] Code signing certificates
- [ ] Portable app version (no installation)
- [ ] System tray integration
- [ ] Windows notification support

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/Keyhad/ghost-mesh/issues
- **Documentation**: See main README.md
- **Logs**: Check PowerShell windows for error messages

## License

See LICENSE file in the project root.
