# Speech-to-Text-to-Action Web Application

A simple speak, understand and answer back app using browser-based speech recognition and AI-powered intent parsing.

## 🎯 Project Overview

This project implements a speech-to-text-to-action system in the browser, allowing users to speak commands that are transcribed, interpreted, and executed.

### Architecture

```
MVP (Phase 1 – Browser STT)
+------------+       WebSocket        +-----------------+
|  Browser   | <--------------------> |    Backend      |
| - WebSpeech|                        | - LLM Intent    |
| - UI/JS    | ---- STT text ------> | - Action Engine |
+------------+ <--- Intent result --- +-----------------+
```

## ⭐ Phase 1: Basic Speech-to-Text in Browser (MVP)

**Goal:** Speak → Display text in browser

**Status:** ✅ Complete

### Features Implemented

✅ "Start Recording" / "Stop Recording" button
✅ Web Speech API (SpeechRecognition) integration
✅ Real-time partial results streaming
✅ Final transcription display
✅ Visual status indicators (pulsing dot when listening)
✅ Transcript history (last 10 items)
✅ Error handling with user-friendly messages
✅ Keyboard shortcut (Space bar to toggle recording)
✅ Responsive design with gradient UI

### How to Use

1. **Open the Application**
   ```bash
   # Simply open index.html in a Chrome-based browser
   # Or serve it with a local server:
   python3 -m http.server 8000
   # Then navigate to: http://localhost:8000
   ```

2. **Grant Microphone Permission**
   - Click "Start Recording"
   - Allow microphone access when prompted

3. **Start Speaking**
   - Partial results appear in real-time as you speak
   - Final results are saved when you pause
   - Click "Stop Recording" when done

### Browser Compatibility

✅ **Supported:**
- Google Chrome (recommended)
- Microsoft Edge
- Brave Browser
- Other Chromium-based browsers

❌ **Not Supported:**
- Firefox (limited support)
- Safari (limited support)

### Tests Verification

✅ **Test 1:** Speak a sentence → text appears
✅ **Test 2:** Partial text updates in real time
✅ **Test 3:** Button toggles recording properly

### Technical Details

**Web Speech API Configuration:**
- `continuous: true` - Keeps listening until manually stopped
- `interimResults: true` - Streams partial results in real-time
- `lang: 'en-US'` - English (US) language model
- `maxAlternatives: 1` - Single transcription result

**Event Handlers:**
- `onstart` - Recognition begins
- `onresult` - New transcription available (interim or final)
- `onend` - Recognition stopped
- `onerror` - Error handling (permissions, network, etc.)

## 🚀 Next Steps (Future Phases)

### Phase 2: Backend Integration
- Set up WebSocket server
- Integrate LLM for intent parsing
- Implement action engine

### Phase 3: Action Execution
- Define action schema
- Execute browser actions (navigation, form filling, etc.)
- Return results to user

### Phase 4: Advanced Features
- Wake word detection
- Multi-language support
- Custom voice commands
- Offline support with local models

## 📁 Project Structure

```
.
├── index.html          # Phase 1 MVP - Browser-based STT
└── README.md          # This file
```

## 🛠️ Development

**Current Phase:** Phase 1 (Complete)
**Branch:** `claude/speech-to-action-module-016LrJP7qpakGcyU8hvnLiy1`

## 📝 License

This is an experimental project for learning purposes.
