#!/bin/bash

# Whisper.cpp WASM Setup Helper Script
# This script helps you copy the built whisper.cpp WASM files to this project

echo "==================================================="
echo "  Whisper.cpp WASM Setup Helper"
echo "==================================================="
echo ""

# Check if whisper.cpp path is provided
if [ -z "$1" ]; then
    echo "Usage: bash setup-whisper.sh /path/to/whisper.cpp"
    echo ""
    echo "Example:"
    echo "  bash setup-whisper.sh ~/whisper.cpp"
    echo "  bash setup-whisper.sh ../whisper.cpp"
    echo ""
    exit 1
fi

WHISPER_PATH="$1"
PROJECT_DIR="$(pwd)"

echo "Whisper.cpp location: $WHISPER_PATH"
echo "Project location: $PROJECT_DIR"
echo ""

# Check if whisper.cpp directory exists
if [ ! -d "$WHISPER_PATH" ]; then
    echo "❌ Error: Directory not found: $WHISPER_PATH"
    exit 1
fi

echo "Looking for whisper.js and whisper.wasm..."
echo ""

# Check common locations for the built files
LOCATIONS=(
    "$WHISPER_PATH"
    "$WHISPER_PATH/examples/whisper.wasm"
    "$WHISPER_PATH/build"
)

FOUND=false

for LOC in "${LOCATIONS[@]}"; do
    if [ -f "$LOC/whisper.js" ] && [ -f "$LOC/whisper.wasm" ]; then
        echo "✅ Found WASM files in: $LOC"
        echo ""

        # Copy files
        echo "Copying files to project..."
        cp "$LOC/whisper.js" "$PROJECT_DIR/"
        cp "$LOC/whisper.wasm" "$PROJECT_DIR/"

        if [ -f "$PROJECT_DIR/whisper.js" ] && [ -f "$PROJECT_DIR/whisper.wasm" ]; then
            echo "✅ Files copied successfully!"
            echo ""
            echo "Files in project:"
            ls -lh "$PROJECT_DIR/whisper.js"
            ls -lh "$PROJECT_DIR/whisper.wasm"
            echo ""
            FOUND=true
            break
        else
            echo "❌ Error: Failed to copy files"
            exit 1
        fi
    fi
done

if [ "$FOUND" = false ]; then
    echo "❌ Could not find whisper.js and whisper.wasm in common locations."
    echo ""
    echo "Searched in:"
    for LOC in "${LOCATIONS[@]}"; do
        echo "  - $LOC"
    done
    echo ""
    echo "You need to build whisper.cpp for WebAssembly first:"
    echo ""
    echo "  cd $WHISPER_PATH/examples/whisper.wasm"
    echo "  bash build.sh"
    echo ""
    echo "Or check WHISPER_SETUP.md for manual build instructions."
    exit 1
fi

# Check for model file
echo "Checking for Whisper model..."
if [ -f "$PROJECT_DIR/ggml-tiny.en.bin" ]; then
    echo "✅ Model found: ggml-tiny.en.bin"
else
    echo "⚠️  No model file found in project directory"
    echo ""
    echo "If you have the model file, copy it here:"
    echo "  cp /path/to/ggml-tiny.en.bin $PROJECT_DIR/"
    echo ""
    echo "Or download it from whisper.cpp:"
    echo "  cd $WHISPER_PATH"
    echo "  bash ./models/download-ggml-model.sh tiny.en"
    echo "  cp models/ggml-tiny.en.bin $PROJECT_DIR/"
fi

echo ""
echo "==================================================="
echo "  Next Steps"
echo "==================================================="
echo ""
echo "1. Make sure you have the model file (ggml-tiny.en.bin)"
echo ""
echo "2. Uncomment the whisper.js script in index.html:"
echo "   Change:"
echo "     <!-- <script src=\"whisper.js\"></script> -->"
echo "   To:"
echo "     <script src=\"whisper.js\"></script>"
echo ""
echo "3. Start the local server:"
echo "   python3 -m http.server 8080"
echo ""
echo "4. Open http://localhost:8080 in your browser"
echo ""
echo "5. Select 'Whisper.cpp (High Accuracy)' from the dropdown"
echo ""
echo "✅ Setup complete!"
echo ""
