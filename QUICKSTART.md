# Quick Start: Whisper.cpp Integration

## TL;DR - Get whisper.js and whisper.wasm

### Option 1: Use the Helper Script (Easiest)

```bash
# In your hello/ project directory
bash setup-whisper.sh /path/to/whisper.cpp
```

This script will:
- Find whisper.js and whisper.wasm automatically
- Copy them to your project
- Check for the model file
- Give you next steps

### Option 2: Manual Copy

**Step 1: Build the WASM files**
```bash
cd /path/to/whisper.cpp/examples/whisper.wasm
bash build.sh
```

**Step 2: Copy the files**
```bash
# These files will be generated in whisper.cpp/examples/whisper.wasm/
cp /path/to/whisper.cpp/examples/whisper.wasm/whisper.js /path/to/hello/
cp /path/to/whisper.cpp/examples/whisper.wasm/whisper.wasm /path/to/hello/
```

**Step 3: Copy your model (you already have this)**
```bash
cp /path/to/ggml-tiny.en.bin /path/to/hello/
```

## What You Need

After setup, your project should have these files:

```
hello/
├── whisper.js              ← JavaScript wrapper (from build)
├── whisper.wasm            ← WASM binary (from build)
├── ggml-tiny.en.bin        ← Model file (you have this)
├── index.html              ← Update this (uncomment whisper.js)
└── ...
```

## Enable Whisper in index.html

Edit `index.html` and find this line (around line 359):

```html
<!-- Whisper.cpp WASM Library -->
<!-- Note: You'll need to host whisper.cpp WASM files locally or from CDN -->
<!-- Example: <script src="whisper.js"></script> -->
```

Change it to:

```html
<!-- Whisper.cpp WASM Library -->
<script src="whisper.js"></script>
```

## Test It

1. **Start server:**
   ```bash
   python3 -m http.server 8080
   ```

2. **Open browser:**
   ```
   http://localhost:8080
   ```

3. **Select Whisper engine** from the dropdown

4. **Check browser console** (F12) for any errors

## Common Issues

### "whisper.js not found" (404 error)
- Make sure `whisper.js` is in the project root (same level as index.html)
- Refresh the page

### "createWhisperModule is not defined"
- The script tag isn't uncommented in index.html
- Or whisper.js didn't load (check network tab in browser)

### "Failed to fetch model"
- Check that `ggml-tiny.en.bin` is in the project root
- Check the browser console for the exact URL it's trying to fetch

### Whisper engine doesn't appear in dropdown
- The engine will still appear in the dropdown
- It will only fail when you try to initialize it if files are missing

## Where Are the Files?

### After building whisper.cpp:

```
whisper.cpp/
└── examples/
    └── whisper.wasm/          ← Build happens here
        ├── whisper.js         ← YOU NEED THIS
        ├── whisper.wasm       ← AND THIS
        ├── index.html         ← Example web page
        └── build.sh           ← Build script
```

### The whisper.wasm FOLDER vs FILE:

- `examples/whisper.wasm/` = FOLDER (contains the example)
- `examples/whisper.wasm/whisper.wasm` = FILE (the actual WASM binary)

Don't confuse them!

## File Sizes (to verify you have the right files)

- `whisper.js` ≈ 50-200 KB (JavaScript wrapper)
- `whisper.wasm` ≈ 1-3 MB (WASM binary)
- `ggml-tiny.en.bin` ≈ 75 MB (model)

If the file sizes are very different, something might be wrong.

## Testing Whisper.cpp First

Before integrating, test that whisper.cpp works:

```bash
cd /path/to/whisper.cpp/examples/whisper.wasm

# Build if not done
bash build.sh

# Start server in the example directory
python3 -m http.server 8080

# Open http://localhost:8080
# This is whisper.cpp's own example
# If this works, you can copy the files to your project
```

## Need More Help?

- See `WHISPER_SETUP.md` for detailed instructions
- See `README.md` for architecture documentation
- Check whisper.cpp repo: https://github.com/ggerganov/whisper.cpp
