#!/bin/bash

# Live Screen Translator Pro - Installation Script
# This script installs all necessary dependencies for the Live Screen Translator

set -e  # Exit on any error

echo "🚀 Live Screen Translator Pro - Installation Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists apt-get; then
            echo "ubuntu"
        elif command_exists yum; then
            echo "centos"
        elif command_exists pacman; then
            echo "arch"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Function to install Node.js
install_nodejs() {
    print_status "Checking Node.js installation..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            print_success "Node.js $(node --version) is already installed"
            return 0
        else
            print_warning "Node.js version $(node --version) is too old. Version 16+ required."
        fi
    fi
    
    print_status "Installing Node.js..."
    OS=$(detect_os)
    
    case $OS in
        "ubuntu"|"debian")
            # Install Node.js using NodeSource repository
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "centos"|"rhel"|"fedora")
            # Install Node.js using NodeSource repository
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
            ;;
        "arch")
            sudo pacman -S nodejs npm
            ;;
        "macos")
            if command_exists brew; then
                brew install node
            else
                print_error "Homebrew not found. Please install Homebrew first: https://brew.sh/"
                exit 1
            fi
            ;;
        "windows")
            print_warning "Please install Node.js manually from https://nodejs.org/"
            print_warning "Make sure to install version 16 or higher"
            ;;
        *)
            print_error "Unsupported operating system: $OS"
            print_error "Please install Node.js manually from https://nodejs.org/"
            exit 1
            ;;
    esac
    
    if command_exists node; then
        print_success "Node.js $(node --version) installed successfully"
    else
        print_error "Failed to install Node.js"
        exit 1
    fi
}

# Function to install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."
    OS=$(detect_os)
    
    case $OS in
        "ubuntu"|"debian")
            print_status "Installing Ubuntu/Debian dependencies..."
            sudo apt-get update
            sudo apt-get install -y \
                libgtk-3-dev \
                libwebkit2gtk-4.0-dev \
                libappindicator3-dev \
                librsvg2-dev \
                libgconf-2-4 \
                libnss3 \
                libxss1 \
                libasound2 \
                libxtst6 \
                libnotify4 \
                libdrm2 \
                libgbm1 \
                libxcomposite1 \
                libxdamage1 \
                libxrandr2 \
                libxfixes3 \
                libxss1 \
                libatk-bridge2.0-0 \
                libgtk-3-0 \
                libgdk-pixbuf2.0-0 \
                libpango-1.0-0 \
                libcairo2 \
                libatk1.0-0 \
                libatspi2.0-0 \
                libcups2 \
                libdbus-1-3 \
                libxcb1 \
                libx11-xcb1 \
                libxcb-dri3-0 \
                libdrm2 \
                libgbm1 \
                libasound2
            ;;
        "centos"|"rhel"|"fedora")
            print_status "Installing CentOS/RHEL/Fedora dependencies..."
            sudo yum groupinstall -y "Development Tools"
            sudo yum install -y \
                gtk3-devel \
                webkitgtk3-devel \
                libappindicator-gtk3 \
                librsvg2-devel \
                libnotify-devel \
                libXScrnSaver-devel \
                libXtst-devel \
                libXcomposite-devel \
                libXdamage-devel \
                libXrandr-devel \
                libXfixes-devel \
                libXss-devel \
                atk-devel \
                gdk-pixbuf2-devel \
                pango-devel \
                cairo-devel \
                cups-devel \
                dbus-devel \
                libxcb-devel \
                libX11-devel \
                libdrm-devel \
                mesa-libgbm-devel \
                alsa-lib-devel
            ;;
        "arch")
            print_status "Installing Arch Linux dependencies..."
            sudo pacman -S --needed \
                gtk3 \
                webkit2gtk \
                libappindicator-gtk3 \
                librsvg \
                libnotify \
                libxss \
                libxtst \
                libxcomposite \
                libxdamage \
                libxrandr \
                libxfixes \
                atk \
                gdk-pixbuf2 \
                pango \
                cairo \
                cups \
                dbus \
                libxcb \
                libx11 \
                libdrm \
                mesa \
                alsa-lib
            ;;
        "macos")
            print_status "Installing macOS dependencies..."
            if command_exists brew; then
                brew install \
                    gtk+3 \
                    webkitgtk \
                    librsvg \
                    libnotify \
                    cairo \
                    pango \
                    atk \
                    gdk-pixbuf
            else
                print_warning "Homebrew not found. Some dependencies may need manual installation."
            fi
            ;;
        "windows")
            print_warning "Windows dependencies will be handled by npm install"
            ;;
        *)
            print_warning "Unknown OS. Some dependencies may need manual installation."
            ;;
    esac
}

# Function to install Tesseract OCR
install_tesseract() {
    print_status "Checking Tesseract OCR installation..."
    
    if command_exists tesseract; then
        print_success "Tesseract OCR is already installed"
        return 0
    fi
    
    print_status "Installing Tesseract OCR..."
    OS=$(detect_os)
    
    case $OS in
        "ubuntu"|"debian")
            sudo apt-get install -y \
                tesseract-ocr \
                tesseract-ocr-chi-sim \
                tesseract-ocr-chi-tra \
                tesseract-ocr-eng
            ;;
        "centos"|"rhel"|"fedora")
            sudo yum install -y \
                tesseract \
                tesseract-langpack-chi-sim \
                tesseract-langpack-chi-tra \
                tesseract-langpack-eng
            ;;
        "arch")
            sudo pacman -S tesseract tesseract-data-chi-sim tesseract-data-chi-tra tesseract-data-eng
            ;;
        "macos")
            if command_exists brew; then
                brew install tesseract tesseract-lang
            else
                print_warning "Please install Tesseract manually"
            fi
            ;;
        "windows")
            print_warning "Please install Tesseract manually from https://github.com/UB-Mannheim/tesseract/wiki"
            ;;
        *)
            print_warning "Please install Tesseract manually for your OS"
            ;;
    esac
    
    if command_exists tesseract; then
        print_success "Tesseract OCR installed successfully"
        print_status "Available languages:"
        tesseract --list-langs
    else
        print_warning "Tesseract OCR installation may have failed. Please install manually."
    fi
}

# Function to install Python dependencies (for PaddleOCR)
install_python_deps() {
    print_status "Checking Python installation..."
    
    if command_exists python3; then
        print_success "Python3 is already installed"
    elif command_exists python; then
        PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1)
        if [ "$PYTHON_VERSION" -ge 3 ]; then
            print_success "Python $(python --version) is already installed"
        else
            print_warning "Python version too old. Python 3.7+ required."
            return 1
        fi
    else
        print_warning "Python not found. PaddleOCR will not be available."
        return 1
    fi
    
    print_status "Installing Python dependencies for PaddleOCR..."
    
    if command_exists pip3; then
        pip3 install paddlepaddle paddleocr
    elif command_exists pip; then
        pip install paddlepaddle paddleocr
    else
        print_warning "pip not found. Please install pip to use PaddleOCR."
        return 1
    fi
    
    print_success "Python dependencies installed successfully"
}

# Function to install npm dependencies
install_npm_deps() {
    print_status "Installing npm dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project directory."
        exit 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "npm dependencies installed successfully"
    else
        print_error "Failed to install npm dependencies"
        exit 1
    fi
}

# Function to create configuration files
setup_config() {
    print_status "Setting up configuration files..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Live Screen Translator Pro Configuration
# Copy this file to .env and modify as needed

# OpenAI API Key (for GPT translation)
# OPENAI_API_KEY=your_openai_api_key_here

# Google Translate API Key (optional)
# GOOGLE_TRANSLATE_API_KEY=your_google_api_key_here

# Server Port
PORT=3000

# Development Mode
NODE_ENV=development

# Log Level
LOG_LEVEL=info
EOF
        print_success "Created .env configuration file"
    else
        print_status ".env file already exists"
    fi
    
    # Create assets directory if it doesn't exist
    mkdir -p assets
    print_success "Configuration setup completed"
}

# Function to run tests
run_tests() {
    print_status "Running basic tests..."
    
    # Test Node.js
    if command_exists node; then
        print_success "Node.js test passed"
    else
        print_error "Node.js test failed"
        return 1
    fi
    
    # Test npm
    if command_exists npm; then
        print_success "npm test passed"
    else
        print_error "npm test failed"
        return 1
    fi
    
    # Test Tesseract
    if command_exists tesseract; then
        print_success "Tesseract test passed"
    else
        print_warning "Tesseract test failed - OCR may not work"
    fi
    
    print_success "All tests completed"
}

# Main installation function
main() {
    echo
    print_status "Starting installation process..."
    echo
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. This is not recommended for security reasons."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Install dependencies
    install_nodejs
    install_system_deps
    install_tesseract
    install_python_deps
    install_npm_deps
    setup_config
    run_tests
    
    echo
    print_success "Installation completed successfully!"
    echo
    echo "🎉 Live Screen Translator Pro is ready to use!"
    echo
    echo "Next steps:"
    echo "1. Configure your API keys in the .env file (optional)"
    echo "2. Run 'npm start' to start the application"
    echo "3. Run 'npm run dev' for development mode with DevTools"
    echo
    echo "For more information, see the README.md file"
    echo
}

# Run main function
main "$@"