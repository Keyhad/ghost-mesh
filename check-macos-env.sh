#!/bin/bash

# GhostMesh macOS Development Environment Check
# This script verifies all prerequisites are met before starting development

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}GhostMesh macOS Environment Check${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Function to print success
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

# Function to print failure
check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

# Function to print warning
check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Function to print info
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check 1: macOS Version
echo -e "\n${BLUE}[1/10] Checking macOS Version...${NC}"
if command -v sw_vers &> /dev/null; then
    MACOS_VERSION=$(sw_vers -productVersion)
    check_pass "macOS $MACOS_VERSION detected"
else
    check_fail "Cannot detect macOS version"
    info "This script requires macOS. If you're on macOS and see this error:"
    info "  1. Verify sw_vers command exists: which sw_vers"
    info "  2. Check your PATH variable: echo \$PATH"
    info "  3. Reinstall Command Line Tools: xcode-select --install"
fi

# Check 2: Homebrew
echo -e "\n${BLUE}[2/10] Checking Homebrew...${NC}"
if command -v brew &> /dev/null; then
    BREW_VERSION=$(brew --version | head -n 1)
    check_pass "$BREW_VERSION installed"
else
    check_fail "Homebrew not installed"
    info "Homebrew is the macOS package manager. Install it with:"
    info "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    info ""
    info "After installation, follow the 'Next steps' instructions to add Homebrew to PATH."
    info "Then restart your terminal and run this check again."
fi

# Check 3: Node.js
echo -e "\n${BLUE}[3/10] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')

    if [ "$NODE_MAJOR" -ge 18 ]; then
        check_pass "Node.js $NODE_VERSION (✓ >= 18.x required)"
    else
        check_warn "Node.js $NODE_VERSION (⚠ v18.x or higher recommended)"
        info "Your Node.js version is outdated. Upgrade with:"
        info "  brew upgrade node"
        info ""
        info "Or install a specific LTS version:"
        info "  brew install node@20"
    fi

    # Check architecture
    NODE_ARCH=$(node -p "process.arch")
    SYSTEM_ARCH=$(uname -m)
    if [ "$NODE_ARCH" = "arm64" ] && [ "$SYSTEM_ARCH" = "arm64" ]; then
        check_pass "Native ARM64 Node.js on Apple Silicon"
    elif [ "$NODE_ARCH" = "x64" ] && [ "$SYSTEM_ARCH" = "x86_64" ]; then
        check_pass "Native x64 Node.js on Intel Mac"
    elif [ "$NODE_ARCH" = "x64" ] && [ "$SYSTEM_ARCH" = "arm64" ]; then
        check_warn "Running x64 Node.js on Apple Silicon (via Rosetta)"
        info "You're running Intel Node.js on Apple Silicon. For better performance:"
        info "  1. Uninstall current Node.js: brew uninstall node"
        info "  2. Ensure you're using native Homebrew (ARM64):"
        info "     which brew  # Should be /opt/homebrew/bin/brew"
        info "  3. Reinstall Node.js: brew install node"
    fi
else
    check_fail "Node.js not installed"
    info "Node.js is required for GhostMesh. Install it with:"
    info "  brew install node@20"
    info ""
    info "After installation, verify with:"
    info "  node --version"
    info "  npm --version"
fi

# Check 4: npm
echo -e "\n${BLUE}[4/10] Checking npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm v$NPM_VERSION installed"
else
    check_fail "npm not installed (should come with Node.js)"
    info "npm is included with Node.js. This error suggests:"
    info "  1. Node.js installation is incomplete or corrupted"
    info "  2. npm is not in your PATH"
    info ""
    info "Try reinstalling Node.js:"
    info "  brew reinstall node"
fi

# Check 5: Xcode Command Line Tools
echo -e "\n${BLUE}[5/10] Checking Xcode Command Line Tools...${NC}"
if xcode-select -p &> /dev/null; then
    XCODE_PATH=$(xcode-select -p)
    check_pass "Xcode Command Line Tools installed at $XCODE_PATH"

    # Verify compiler
    if command -v clang &> /dev/null; then
        CLANG_VERSION=$(clang --version | head -n 1)
        check_pass "Clang compiler available: $CLANG_VERSION"
    else
        check_warn "Clang compiler not found"
        info "Clang should be included with Command Line Tools. Try:"
        info "  sudo xcode-select --reset"
        info "  xcode-select --install"
    fi
else
    check_fail "Xcode Command Line Tools not installed"
    info "Command Line Tools are required to compile native Node.js modules."
    info "Install them with:"
    info "  xcode-select --install"
    info ""
    info "A dialog will appear - click 'Install' and wait for completion."
    info "This may take 10-20 minutes depending on your connection."
fi

# Check 6: Python (required by node-gyp)
echo -e "\n${BLUE}[6/10] Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    check_pass "$PYTHON_VERSION installed"
else
    check_warn "Python3 not found (required by node-gyp)"
    info "Python 3 is required by node-gyp to compile native modules."
    info "Install it with:"
    info "  brew install python@3"
    info ""
    info "After installation, verify with:"
    info "  python3 --version"
fi

# Check 7: Bluetooth
echo -e "\n${BLUE}[7/10] Checking Bluetooth...${NC}"
if system_profiler SPBluetoothDataType 2>/dev/null | grep -q "Bluetooth Power: On"; then
    check_pass "Bluetooth is enabled"
else
    check_warn "Bluetooth may be disabled or unavailable"
    info "GhostMesh requires Bluetooth to communicate with mesh devices."
    info "To enable Bluetooth:"
    info "  1. Open System Settings (or System Preferences)"
    info "  2. Click 'Bluetooth'"
    info "  3. Toggle Bluetooth ON"
    info ""
    info "If Bluetooth is not available:"
    info "  - Check if your Mac has Bluetooth hardware (most Macs do)"
    info "  - Restart your Mac"
    info "  - Reset SMC if Bluetooth is not detected"
fi

# Check 8: Project Dependencies
echo -e "\n${BLUE}[8/10] Checking Project Dependencies...${NC}"
if [ -f "package.json" ]; then
    check_pass "package.json found"

    if [ -d "node_modules" ]; then
        check_pass "node_modules directory exists"

        # Check critical packages
        NOBLE_INSTALLED=false
        WS_INSTALLED=false
        NEXT_INSTALLED=false

        if [ -d "node_modules/@abandonware/noble" ]; then
            NOBLE_INSTALLED=true
        fi

        if [ -d "node_modules/ws" ]; then
            WS_INSTALLED=true
        fi

        if [ -d "node_modules/next" ]; then
            NEXT_INSTALLED=true
        fi

        if [ "$NOBLE_INSTALLED" = true ] && [ "$WS_INSTALLED" = true ] && [ "$NEXT_INSTALLED" = true ]; then
            check_pass "Critical packages installed (@abandonware/noble, ws, next)"
        else
            check_warn "Some critical packages are missing"
            info "Install missing packages with:"
            info "  npm install"
            info ""
            info "If installation fails, try:"
            info "  1. Clear npm cache: npm cache clean --force"
            info "  2. Remove node_modules: rm -rf node_modules package-lock.json"
            info "  3. Reinstall: npm install"
        fi
    else
        check_fail "node_modules not found"
        info "Project dependencies are not installed. Install them with:"
        info "  npm install"
        info ""
        info "This will:"
        info "  - Install all Node.js dependencies"
        info "  - Compile native modules (@abandonware/noble)"
        info "  - May take 5-10 minutes on first run"
        info ""
        info "If you encounter errors during installation:"
        info "  1. Ensure Xcode Command Line Tools are installed"
        info "  2. Check that Python 3 is available"
        info "  3. Try: npm install --verbose (for detailed error info)"
    fi
else
    check_fail "package.json not found - are you in the project directory?"
    info "Cannot find package.json. Make sure you're in the ghost-mesh directory:"
    info "  cd ~/Projects/ghost-mesh"
    info "  ./check-macos-env.sh"
fi

# Check 9: Build Output
echo -e "\n${BLUE}[9/10] Checking Build Output...${NC}"
if [ -d "server-dist" ] || [ -d "dist" ]; then
    check_pass "Build output directory exists"
else
    check_warn "Build output not found"
    info "The BLE server needs to be compiled before running. Build it with:"
    info "  npm run build:server"
    info ""
    info "This compiles the TypeScript server code to JavaScript."
    info "You'll need to rebuild after making changes to server/*.ts files."
fi

# Check 10: Permissions
echo -e "\n${BLUE}[10/10] Checking Permissions...${NC}"
CURRENT_USER=$(whoami)
if [ -w "." ]; then
    check_pass "Write permissions in project directory"
else
    check_fail "No write permissions in project directory"
    info "You don't have write permissions in this directory."
    info "Fix ownership with:"
    info "  sudo chown -R $CURRENT_USER ."
    info ""
    info "Or change permissions:"
    info "  sudo chmod -R u+w ."
fi

# Check Bluetooth permissions (modern macOS)
if [ -f ~/Library/Preferences/com.apple.security.tcc.plist ]; then
    check_pass "Privacy database accessible"
else
    check_warn "Cannot verify Bluetooth privacy permissions"
    info "macOS requires apps to have Bluetooth permission."
    info "When you first run the BLE server, macOS will prompt for access."
    info ""
    info "To verify or change permissions manually:"
    info "  1. Open System Settings → Privacy & Security → Bluetooth"
    info "  2. Ensure Terminal (or your terminal app) is enabled"
    info ""
    info "If you denied permission by mistake:"
    info "  1. Toggle Terminal OFF then ON in Bluetooth permissions"
    info "  2. Restart Terminal"
    info "  3. Run the BLE server again"
fi

# Summary
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Passed:${NC}  $CHECKS_PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}  $CHECKS_FAILED"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ Environment is ready!${NC}"

    if [ $WARNINGS -gt 0 ]; then
        echo -e "\n${YELLOW}Note:${NC} You have $WARNINGS warning(s). Review them above."
        echo -e "The warnings won't prevent development, but may affect functionality."
    fi

    echo -e "\nYou can start development with:"
    echo -e "  ${BLUE}npm run dev:all${NC}     # Run both web UI and BLE server"
    echo -e "  ${BLUE}npm run ble-server${NC}  # Run BLE server only"
    echo -e "  ${BLUE}npm run dev${NC}         # Run web UI only"
    echo -e "\n${BLUE}Access the web UI at:${NC} http://localhost:3000"
    echo -e "${BLUE}WebSocket server at:${NC} ws://localhost:8080"
    exit 0
else
    echo -e "\n${RED}✗ Please fix the $CHECKS_FAILED failed check(s) above before starting.${NC}"
    echo -e "\n${BLUE}Quick fix for most common issues:${NC}"
    echo -e "  1. Install dependencies: ${BLUE}npm install${NC}"
    echo -e "  2. Build server: ${BLUE}npm run build:server${NC}"
    echo -e "  3. Run this check again: ${BLUE}./check-macos-env.sh${NC}"
    exit 1
fi
