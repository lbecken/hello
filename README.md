# Speech-to-Text Web Application

A progressive implementation of browser-based speech recognition with a **plugin architecture** supporting multiple STT engines, evolving from cloud-based to on-device WebAssembly processing.

## 🎯 Project Overview

This project implements high-quality speech-to-text in the browser with complete privacy and offline capability using WebAssembly. The modular plugin architecture allows you to choose between different STT engines based on your needs.

### Architecture Evolution

```
Phase 1 (DEPRECATED)          Phase 2 (Previous)           Phase 3 (CURRENT)
+----------------+             +------------------+         +----------------------+
|    Browser     |             |     Browser      |         |      Browser         |
| - Web Speech   |             | - Vosk WASM      |         | - Plugin Engine:     |
| - Cloud API ☁️ |             | - On-Device 🔒   |         |   * Vosk (Fast)      |
+----------------+             +------------------+         |   * Whisper (Accurate)|
     ↓ Internet                     ↓ No Network            +----------------------+
  Google Cloud                   Local Processing               Local Processing
```

## 🚀 Phase 3: Multi-Engine Plugin Architecture (CURRENT)

**Goal:** Modular STT system supporting multiple engines with easy extensibility

**Status:** ✅ Complete

**Technologies:** Vosk WASM, Whisper.cpp WASM

### Key Features

✅ **Plugin Architecture** - Easily switch between different STT engines
✅ **Multiple Engine Support** - Vosk (fast, real-time) and Whisper.cpp (high accuracy)
✅ **100% On-Device Processing** - All speech recognition happens locally
✅ **Complete Privacy** - Audio never leaves your device
✅ **Offline Capable** - Works without internet after initial model download
✅ **Modular Codebase** - Clean separation between core app and engine plugins
✅ **Easy to Extend** - Add new STT engines by implementing the base class

### Available Engines

#### 🚀 Vosk Engine
- **Best for:** Real-time transcription, fast processing
- **Model size:** ~40MB (small model)
- **Latency:** Very low (<500ms)
- **Accuracy:** Good for general speech
- **Features:** Real-time partial results, streaming recognition

#### 🎯 Whisper.cpp Engine
- **Best for:** High-accuracy transcription, batch processing
- **Model size:** ~75MB (tiny model), larger models available
- **Latency:** Moderate (processes in chunks)
- **Accuracy:** Excellent, state-of-the-art
- **Features:** Punctuation, capitalization, multi-language support

## 📁 Project Structure

```
.
├── index.html                      # Main HTML with UI
├── vosk-model-small-en-us-0.15.zip # Vosk model file
├── js/
│   ├── core/
│   │   ├── STTEngine.js           # Base class for all engines
│   │   └── app.js                  # Main application logic
│   └── engines/
│       ├── VoskEngine.js           # Vosk WASM implementation
│       └── WhisperEngine.js        # Whisper.cpp implementation
└── README.md
```

### Architecture Design

**STTEngine Base Class** (`js/core/STTEngine.js`)
- Abstract base class defining the interface for all STT engines
- Methods: `initialize()`, `startListening()`, `stopListening()`, `processAudio()`
- Callbacks: `onPartialResult()`, `onFinalResult()`, `onError()`, `onStatusChange()`, `onProgress()`

**VoskEngine** (`js/engines/VoskEngine.js`)
- Implements real-time streaming speech recognition
- Processes audio continuously with low latency
- Provides both partial and final results

**WhisperEngine** (`js/engines/WhisperEngine.js`)
- Implements batch processing for high accuracy
- Collects audio chunks and processes them together
- Note: Requires whisper.cpp WASM library (not included in CDN)

**Main App** (`js/core/app.js`)
- Manages UI interactions
- Handles engine switching
- Coordinates callbacks and events

## 🛠️ How to Use

### 1. **Set Up Local Server**

The models need to be served via HTTP to avoid CORS issues:

```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: Node.js
npx serve -p 8080 .

# Option 3: PHP
php -S localhost:8080
```

### 2. **Open the Application**

Navigate to: `http://localhost:8080`

### 3. **Select an Engine**

Choose your preferred STT engine from the dropdown:
- **Vosk (Fast, Real-time)** - For interactive conversations
- **Whisper.cpp (High Accuracy)** - For precise transcription

### 4. **Wait for Model Loading**

- First load downloads the model (~40-75MB depending on engine)
- Progress bar shows download status
- Model is cached for future use

### 5. **Start Recording**

- Click "Start Recording" when ready
- Grant microphone permission if prompted
- Speak clearly into your microphone
- Click "Stop Recording" when done

## 🔌 Adding a New Engine

To add a new STT engine, create a new class that extends `STTEngine`:

```javascript
// js/engines/MyNewEngine.js
class MyNewEngine extends STTEngine {
    getInfo() {
        return {
            name: 'My New Engine',
            version: '1.0.0',
            description: 'Description of my engine',
            features: ['Feature 1', 'Feature 2']
        };
    }

    async initialize(config = {}) {
        // Load your model
        // Set up your engine
        this.isInitialized = true;
        this._emitStatusChange('ready', 'Ready');
    }

    async startListening(audioConfig = {}) {
        // Set up microphone
        // Start processing audio
        this.isListening = true;
        this._emitStatusChange('listening', 'Listening...');
    }

    async stopListening() {
        // Clean up resources
        this.isListening = false;
        this._emitStatusChange('ready', 'Ready');
    }

    processAudio(audioData) {
        // Process audio and emit results
        this._emitPartialResult('partial text...');
        this._emitFinalResult('final text');
    }
}
```

Then register it in `js/core/app.js`:

```javascript
registerEngines() {
    this.engines.myNewEngine = new MyNewEngine();
}
```

## 🌐 Browser Compatibility

✅ **Fully Supported:**
- Google Chrome 90+
- Microsoft Edge 90+
- Firefox 88+
- Safari 14+
- Brave Browser

**Requirements:**
- WebAssembly support
- Web Audio API support
- getUserMedia API (for microphone access)

## 📊 Engine Comparison

| Feature | Vosk | Whisper.cpp |
|---------|------|-------------|
| **Speed** | ⚡ Very Fast | 🐌 Moderate |
| **Accuracy** | ✅ Good | 🎯 Excellent |
| **Latency** | <500ms | 1-3s (batch) |
| **Model Size** | ~40MB | ~75MB+ |
| **Real-time** | ✅ Yes | ❌ No (chunks) |
| **Punctuation** | ❌ No | ✅ Yes |
| **Languages** | Model-specific | Multi-language |
| **Use Case** | Live conversation | Accurate transcription |

## 🔧 Configuration

### Vosk Configuration

```javascript
{
    modelUrl: 'http://localhost:8080/vosk-model-small-en-us-0.15.zip',
    sampleRate: 16000
}
```

### Whisper.cpp Configuration

```javascript
{
    modelUrl: 'http://localhost:8080/ggml-tiny.en.bin',
    sampleRate: 16000,
    maxChunkDuration: 30  // seconds per chunk
}
```

## 📦 Setting Up Whisper.cpp

**📘 See [QUICKSTART.md](QUICKSTART.md) for quick instructions**
**📕 See [WHISPER_SETUP.md](WHISPER_SETUP.md) for detailed setup guide**

### Quick Setup

The Whisper engine requires the whisper.cpp WASM library. Here's the quick version:

**Option 1: Use the helper script**
```bash
# After building whisper.cpp
bash setup-whisper.sh /path/to/whisper.cpp
```

**Option 2: Manual setup**

1. **Build whisper.cpp WASM:**
   ```bash
   cd /path/to/whisper.cpp/examples/whisper.wasm
   bash build.sh
   ```

2. **Copy the generated files:**
   ```bash
   # Copy from whisper.cpp/examples/whisper.wasm/ to your project root
   cp whisper.js /path/to/hello/
   cp whisper.wasm /path/to/hello/
   cp /path/to/ggml-tiny.en.bin /path/to/hello/
   ```

3. **Enable in index.html:**
   ```html
   <!-- Change this line (around line 359): -->
   <script src="whisper.js"></script>
   ```

**Files you need:**
- `whisper.js` - JavaScript wrapper (generated by build)
- `whisper.wasm` - WASM binary (generated by build)
- `ggml-tiny.en.bin` - Model file (download separately)

**Where to find them after building:**
```
whisper.cpp/examples/whisper.wasm/
├── whisper.js          ← Copy this
├── whisper.wasm        ← Copy this
└── build.sh
```

## 🚀 Future Enhancements

### Potential Improvements
- Additional engines (Faster-Whisper, Conformer, etc.)
- Multi-language support with auto-detection
- Custom vocabulary for domain-specific terms
- Voice Activity Detection (VAD) for automatic start/stop
- Speaker diarization (who said what)
- Real-time translation between languages
- Export transcripts to various formats (TXT, SRT, VTT)
- Cloud sync and storage options
- Mobile-optimized version

## 🐛 Troubleshooting

**Model fails to load:**
- Ensure you're running a local HTTP server (not file://)
- Check that the model file exists in the correct location
- Check browser console for CORS or network errors

**No microphone access:**
- Grant microphone permissions in browser settings
- Ensure microphone is connected and working
- Check that no other app is using the microphone

**Whisper engine not available:**
- The Whisper engine requires whisper.cpp WASM files
- Follow the "Setting Up Whisper.cpp" section above
- For testing, use the Vosk engine which works out of the box

**Poor recognition accuracy:**
- Try switching engines (Whisper for higher accuracy)
- Speak clearly at a moderate pace
- Reduce background noise
- Use a high-quality external microphone

## 📜 Version History

### Phase 3: Multi-Engine Plugin Architecture (CURRENT)
- ✅ Plugin architecture with base STTEngine class
- ✅ Modular code structure (core + engines)
- ✅ Support for Vosk and Whisper.cpp
- ✅ Engine selector UI
- ✅ Easy extensibility for new engines

### Phase 2: On-Device Vosk WASM
- ✅ Single-engine implementation with Vosk
- ✅ 100% on-device processing
- ✅ Real-time transcription
- ✅ Offline capability

### Phase 1: Web Speech API (DEPRECATED)
- ❌ Cloud-based processing
- ❌ Chrome-only support
- ❌ Privacy concerns

## 📝 License

MIT - This is an experimental project for learning purposes.

## 🙏 Acknowledgments

- **Vosk** - Alpha Cephei Inc. (https://alphacephei.com/vosk/)
- **Whisper.cpp** - Georgi Gerganov (https://github.com/ggerganov/whisper.cpp)
- **OpenAI Whisper** - OpenAI (https://github.com/openai/whisper)
