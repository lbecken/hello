# Phase 3: WebSocket Backend + Intent Interpreter

**Status:** ✅ Complete

**Goal:** Real-time speech → text → intent → action flow with LLM interpretation

## 🎯 Architecture Overview

```
+----------------+           WebSocket          +-------------------+
|    Browser     | <------------------------>   |  Backend Server   |
| - STT (WASM)   |  ---- STT text -------->     | - Intent LLM      |
| - WebSocket    |  <---- Intent/Action ---     | - Action Engine   |
| - UI Display   |                              +-------------------+
+----------------+
```

## 🚀 Features Implemented

### Frontend (Browser)
- ✅ **WebSocket Client** (`js/core/WebSocketClient.js`)
  - Auto-reconnect with exponential backoff
  - Real-time bidirectional communication
  - Event-driven callbacks
  - Connection status monitoring

- ✅ **Enhanced UI** (`index.html`)
  - WebSocket connection status indicator
  - Intent interpretation display
  - Action result display
  - Confidence level badges
  - Real-time updates

- ✅ **Integrated App** (`js/core/app.js`)
  - Sends partial STT text (optional)
  - Sends final STT text for intent interpretation
  - Displays intent and action results
  - Error handling

### Backend (Node.js)
- ✅ **WebSocket Server** (`backend/src/server.js`)
  - Handles multiple concurrent connections
  - Message routing and error handling
  - Real-time processing pipeline

- ✅ **Intent Interpreter** (`backend/src/intentInterpreter.js`)
  - **Dual Mode:**
    - OpenAI GPT-4o-mini (with API key)
    - Pattern matching (fallback, no API key needed)
  - Structured intent extraction
  - Confidence scoring
  - Parameter extraction

- ✅ **Action Executor** (`backend/src/actionExecutor.js`)
  - Simulated smart home controls
  - Device state management
  - Action result formatting
  - Extensible action system

## 📊 Message Flow

### 1. User Speaks
```
User: "turn on the lights"
  ↓
STT Engine (Vosk/Whisper)
  ↓
Final Text: "turn on the lights"
```

### 2. Client → Server (WebSocket)
```json
{
  "type": "stt",
  "text": "turn on the lights",
  "partial": false,
  "timestamp": "2025-11-22T..."
}
```

### 3. Server → Intent Interpretation
```javascript
// LLM or pattern matching
interpret("turn on the lights")
  ↓
{
  "intent": "TURN_ON_LIGHT",
  "action": "turn_on",
  "target": "lights",
  "confidence": 0.95
}
```

### 4. Server → Client (Intent)
```json
{
  "type": "intent",
  "intent": {
    "intent": "TURN_ON_LIGHT",
    "action": "turn_on",
    "target": "lights",
    "confidence": 0.95
  },
  "processingTime": 234
}
```

### 5. Action Execution
```javascript
execute({ intent: "TURN_ON_LIGHT" })
  ↓
{
  "success": true,
  "message": "💡 Lights turned ON",
  "state": { "lights": true }
}
```

### 6. Server → Client (Action Result)
```json
{
  "type": "action_result",
  "result": {
    "success": true,
    "message": "💡 Lights turned ON",
    "state": { "lights": true }
  },
  "totalTime": 239
}
```

### 7. UI Update
```
Browser displays:
- Intent: TURN_ON_LIGHT (95% confident)
- Action: turn_on
- Target: lights
- Result: 💡 Lights turned ON
```

## 🛠️ Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment (Optional)

```bash
cd backend
cp .env.example .env
# Edit .env to add OpenAI API key (optional)
```

**Note:** Backend works with or without API key:
- **With API key:** Uses GPT-4o-mini for accurate intent classification
- **Without API key:** Uses pattern matching (still fully functional!)

### 3. Start Backend Server

```bash
cd backend
npm start
```

Server will start on `ws://localhost:8081`

### 4. Start Frontend Server

In a separate terminal:

```bash
# In project root
python3 -m http.server 8080
```

### 5. Open Browser

Navigate to: `http://localhost:8080`

## 🎮 How to Use

1. **Wait for Models to Load**
   - Vosk model downloads (~40MB)
   - WebSocket connects to backend

2. **Check Connection Status**
   - Look for "🟢 Connected" indicator
   - Shows mode (openai/pattern)

3. **Start Recording**
   - Click "Start Recording"
   - Grant microphone permission

4. **Speak a Command**
   - Examples:
     - "turn on the lights"
     - "what's the weather"
     - "play some music"
     - "set timer for 5 minutes"

5. **Watch the Flow**
   - **Partial Results:** Real-time STT text
   - **Final Results:** Complete transcription
   - **Intent:** Interpreted meaning
   - **Action Result:** Execution outcome

## 📝 Supported Intents

| Intent | Example Commands |
|--------|-----------------|
| `TURN_ON_LIGHT` | "turn on the lights", "lights on" |
| `TURN_OFF_LIGHT` | "turn off the lights", "lights off" |
| `SEARCH_WEATHER` | "what's the weather", "check weather" |
| `PLAY_MUSIC` | "play music", "play some jazz" |
| `SET_TIMER` | "set timer for 5 minutes" |
| `SET_TEMPERATURE` | "set temperature to 72 degrees" |
| `UNKNOWN` | Unrecognized commands |

## 🗂️ Project Structure

```
.
├── backend/
│   ├── package.json              # Backend dependencies
│   ├── .env.example              # Environment template
│   ├── README.md                 # Backend documentation
│   └── src/
│       ├── server.js             # WebSocket server
│       ├── intentInterpreter.js  # LLM intent extraction
│       └── actionExecutor.js     # Action execution logic
│
├── js/
│   ├── core/
│   │   ├── app.js               # Main app (updated)
│   │   ├── STTEngine.js         # STT base class
│   │   └── WebSocketClient.js   # WebSocket client (NEW)
│   └── engines/
│       ├── VoskEngine.js        # Vosk STT
│       └── WhisperEngine.js     # Whisper STT
│
├── index.html                   # UI (updated with intent display)
├── README.md                    # Main documentation
└── PHASE3.md                    # This file
```

## 🔌 WebSocket Protocol

### Client → Server Messages

#### STT Text
```json
{
  "type": "stt",
  "text": "command text",
  "partial": false
}
```

#### Ping
```json
{
  "type": "ping"
}
```

#### Get State
```json
{
  "type": "get_state"
}
```

### Server → Client Messages

#### System Message
```json
{
  "type": "system",
  "message": "Connected to Intent Interpreter",
  "mode": "openai"
}
```

#### Intent
```json
{
  "type": "intent",
  "intent": { ... },
  "processingTime": 234
}
```

#### Action Result
```json
{
  "type": "action_result",
  "result": { ... },
  "totalTime": 239
}
```

#### Error
```json
{
  "type": "error",
  "message": "Error description"
}
```

## 🎨 UI Components

### WebSocket Status
- 🟢 Connected (green)
- 🔴 Disconnected (red)
- ⚫ Connecting (gray)

### Intent Display
- Intent name (uppercase)
- Confidence badge (color-coded)
- Action and target details
- Parameters (if any)
- Suggestions (for unknown intents)

### Action Result
- Success/error indicator (color)
- Result message
- Device state changes
- Additional data (weather, etc.)

## 🔧 Configuration

### Backend Port
Edit `backend/src/server.js` or set `PORT` env variable:
```javascript
const PORT = process.env.PORT || 8081;
```

### WebSocket URL
Edit `js/core/app.js`:
```javascript
this.wsClient = new WebSocketClient('ws://localhost:8081');
```

### LLM Model
Edit `backend/src/intentInterpreter.js`:
```javascript
model: 'gpt-4o-mini'  // or 'gpt-4', 'gpt-3.5-turbo'
```

## 🧪 Testing

### Test WebSocket Connection
```javascript
// Open browser console
const ws = new WebSocket('ws://localhost:8081');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', JSON.parse(e.data));
```

### Test Intent Interpretation
```javascript
// In browser console (after recording)
app.wsClient.sendSTT('turn on the lights', false);
```

### Test Pattern Matching
```bash
# Start backend WITHOUT API key
cd backend
npm start
```

Then speak commands and see pattern matching in action.

## 🚀 Future Enhancements

### Backend
- [ ] Support for local LLMs (Ollama, LM Studio)
- [ ] Persistent device state (database)
- [ ] User authentication
- [ ] Multi-user support
- [ ] Real smart home integration (Home Assistant, etc.)
- [ ] Custom action plugins
- [ ] Voice feedback synthesis (TTS)

### Frontend
- [ ] Voice activity detection (auto start/stop)
- [ ] Multi-language support
- [ ] Custom wake word
- [ ] Action confirmation UI
- [ ] Device control dashboard
- [ ] Historical action log

### Infrastructure
- [ ] Deploy backend to cloud (Heroku, Railway)
- [ ] HTTPS/WSS for production
- [ ] Rate limiting
- [ ] Monitoring and analytics
- [ ] Docker containerization

## 🐛 Troubleshooting

### WebSocket Won't Connect
- Ensure backend is running: `cd backend && npm start`
- Check backend logs for errors
- Verify port 8081 is not in use
- Check browser console for errors

### Intent Not Working
- Without API key: Uses pattern matching (limited intents)
- With API key: Check `.env` file is configured
- Check backend logs for LLM errors
- Verify OpenAI API key is valid

### Poor Intent Recognition
- Speak clearly and at moderate pace
- Use commands from supported intents list
- With API key: Better accuracy
- Without API key: Exact phrase matching

### UI Not Updating
- Check WebSocket status indicator
- Verify browser console for errors
- Ensure `WebSocketClient.js` is loaded
- Check network tab for WebSocket connection

## 📊 Performance

### Latency Breakdown
- **STT Processing:** 100-500ms (Vosk)
- **WebSocket Transfer:** <10ms
- **Intent Interpretation:**
  - Pattern matching: <5ms
  - LLM (GPT-4o-mini): 100-300ms
- **Action Execution:** <50ms
- **Total:** ~200-850ms end-to-end

### Resource Usage
- **Frontend:** ~100-150MB RAM (Vosk model loaded)
- **Backend:** ~50-100MB RAM (Node.js)
- **Network:** Minimal (~1KB per message)

## 🙏 Acknowledgments

Built on top of:
- Phase 2: Multi-Engine STT (Vosk/Whisper)
- Phase 1: Web Speech API (deprecated)

Technologies:
- **WebSocket:** Real-time communication
- **OpenAI GPT-4o-mini:** Intent interpretation
- **Node.js:** Backend server
- **Vosk WASM:** On-device STT
- **Vanilla JS:** Frontend (no frameworks!)

## 📜 License

MIT - Educational project
