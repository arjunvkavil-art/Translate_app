@echo off
setlocal enabledelayedexpansion

REM Live Screen Translator Pro - Windows Installation Script
REM This script installs all necessary dependencies for the Live Screen Translator

echo 🚀 Live Screen Translator Pro - Installation Script
echo ==================================================

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [WARNING] Running as administrator. This is not recommended for security reasons.
    set /p "continue=Continue anyway? (y/N): "
    if /i not "!continue!"=="y" exit /b 1
)

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js !NODE_VERSION! is already installed
) else (
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org/
    echo [ERROR] Make sure to install version 16 or higher
    pause
    exit /b 1
)

REM Check if npm is installed
echo [INFO] Checking npm installation...
npm --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [SUCCESS] npm !NPM_VERSION! is already installed
) else (
    echo [ERROR] npm not found. Please install npm
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project directory.
    pause
    exit /b 1
)

REM Install npm dependencies
echo [INFO] Installing npm dependencies...
npm install
if %errorLevel% == 0 (
    echo [SUCCESS] npm dependencies installed successfully
) else (
    echo [ERROR] Failed to install npm dependencies
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env configuration file...
    (
        echo # Live Screen Translator Pro Configuration
        echo # Copy this file to .env and modify as needed
        echo.
        echo # OpenAI API Key ^(for GPT translation^)
        echo # OPENAI_API_KEY=your_openai_api_key_here
        echo.
        echo # Google Translate API Key ^(optional^)
        echo # GOOGLE_TRANSLATE_API_KEY=your_google_api_key_here
        echo.
        echo # Server Port
        echo PORT=3000
        echo.
        echo # Development Mode
        echo NODE_ENV=development
        echo.
        echo # Log Level
        echo LOG_LEVEL=info
    ) > .env
    echo [SUCCESS] Created .env configuration file
) else (
    echo [INFO] .env file already exists
)

REM Create assets directory if it doesn't exist
if not exist "assets" (
    mkdir assets
    echo [SUCCESS] Created assets directory
)

REM Check if Tesseract is installed
echo [INFO] Checking Tesseract OCR installation...
tesseract --version >nul 2>&1
if %errorLevel% == 0 (
    echo [SUCCESS] Tesseract OCR is already installed
) else (
    echo [WARNING] Tesseract OCR not found. Please install Tesseract from:
    echo [WARNING] https://github.com/UB-Mannheim/tesseract/wiki
    echo [WARNING] Make sure to install Chinese language packs ^(chi_sim, chi_tra^)
)

REM Check if Python is installed (for PaddleOCR)
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo [SUCCESS] Python is already installed
    echo [INFO] Installing Python dependencies for PaddleOCR...
    pip install paddlepaddle paddleocr
    if %errorLevel% == 0 (
        echo [SUCCESS] Python dependencies installed successfully
    ) else (
        echo [WARNING] Failed to install Python dependencies. PaddleOCR will not be available.
    )
) else (
    echo [WARNING] Python not found. PaddleOCR will not be available.
)

REM Run basic tests
echo [INFO] Running basic tests...

REM Test Node.js
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo [SUCCESS] Node.js test passed
) else (
    echo [ERROR] Node.js test failed
    pause
    exit /b 1
)

REM Test npm
npm --version >nul 2>&1
if %errorLevel% == 0 (
    echo [SUCCESS] npm test passed
) else (
    echo [ERROR] npm test failed
    pause
    exit /b 1
)

REM Test Tesseract
tesseract --version >nul 2>&1
if %errorLevel% == 0 (
    echo [SUCCESS] Tesseract test passed
) else (
    echo [WARNING] Tesseract test failed - OCR may not work
)

echo.
echo [SUCCESS] Installation completed successfully!
echo.
echo 🎉 Live Screen Translator Pro is ready to use!
echo.
echo Next steps:
echo 1. Configure your API keys in the .env file ^(optional^)
echo 2. Run 'npm start' to start the application
echo 3. Run 'npm run dev' for development mode with DevTools
echo.
echo For more information, see the README.md file
echo.
pause