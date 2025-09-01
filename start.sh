#!/bin/bash

# Live Screen Translator Startup Script

echo "🌟 Live Screen Translator"
echo "========================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.7+"
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Please install pip"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/installed.flag" ]; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    touch venv/installed.flag
    echo "✅ Dependencies installed"
fi

# Check what the user wants to do
echo ""
echo "What would you like to do?"
echo "1. 🚀 Start Live Screen Translator"
echo "2. 🎮 Run Demo"
echo "3. 🧪 Run Tests"
echo "4. 🔧 Reinstall Dependencies"

read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Starting Live Screen Translator..."
        python main.py
        ;;
    2)
        echo "🎮 Running demo..."
        python demo.py
        ;;
    3)
        echo "🧪 Running tests..."
        python test_basic.py
        ;;
    4)
        echo "🔧 Reinstalling dependencies..."
        rm -f venv/installed.flag
        pip install -r requirements.txt --force-reinstall
        touch venv/installed.flag
        echo "✅ Dependencies reinstalled"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac