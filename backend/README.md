# STT Intent Interpreter Backend

WebSocket backend server that receives speech-to-text (STT) transcriptions and interprets user intent using LLM or pattern matching.

## Architecture

```
Browser (STT) → WebSocket → Intent Interpreter → Action Executor → Results
```

## Features

- ✅ **WebSocket Server** - Real-time bidirectional communication
- ✅ **Intent Interpretation** - Uses GPT-4o-mini or pattern matching
- ✅ **Action Execution** - Simulated smart home/assistant actions
- ✅ **Dual Mode** - Works with or without OpenAI API key

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file (optional):

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key (optional)
```

**Modes:**
- **With API Key:** Uses GPT-4o-mini for accurate intent classification
- **Without API Key:** Falls back to pattern matching (still functional!)

## Usage

### Start the Server

```bash
npm start
```

Or with auto-reload during development:

```bash
npm run dev
```

The server will start on `ws://localhost:8081`

## Message Protocol

### Client → Server

#### STT Text (Final)
```json
{
  "type": "stt",
  "text": "turn on the lights",
  "partial": false
}
```

#### STT Text (Partial)
```json
{
  "type": "stt",
  "text": "turn on the...",
  "partial": true
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

### Server → Client

#### System Message
```json
{
  "type": "system",
  "message": "Connected to Intent Interpreter",
  "mode": "openai",
  "timestamp": "2025-11-22T..."
}
```

#### Partial Echo
```json
{
  "type": "partial",
  "text": "turn on the...",
  "timestamp": "2025-11-22T..."
}
```

#### Intent Result
```json
{
  "type": "intent",
  "intent": {
    "intent": "TURN_ON_LIGHT",
    "action": "turn_on",
    "target": "lights",
    "confidence": 0.95,
    "raw_text": "turn on the lights"
  },
  "processingTime": 234,
  "timestamp": "2025-11-22T..."
}
```

#### Action Result
```json
{
  "type": "action_result",
  "result": {
    "success": true,
    "message": "💡 Lights turned ON",
    "state": { "lights": true }
  },
  "intent": { ... },
  "processingTime": 5,
  "totalTime": 239,
  "timestamp": "2025-11-22T..."
}
```

#### Error
```json
{
  "type": "error",
  "message": "Error description",
  "timestamp": "2025-11-22T..."
}
```

## Supported Intents

### Light Control
- `TURN_ON_LIGHT` - "turn on the lights"
- `TURN_OFF_LIGHT` - "turn off the lights"

### Weather
- `SEARCH_WEATHER` - "what's the weather"

### Music
- `PLAY_MUSIC` - "play music" / "play some jazz"

### Timer
- `SET_TIMER` - "set timer for 5 minutes"

### Temperature
- `SET_TEMPERATURE` - "set temperature to 72 degrees"

### Unknown
- `UNKNOWN` - Unrecognized intent

## Files

- `src/server.js` - Main WebSocket server
- `src/intentInterpreter.js` - LLM or pattern-based intent extraction
- `src/actionExecutor.js` - Executes actions based on intent
- `package.json` - Dependencies and scripts
- `.env` - Configuration (create from `.env.example`)

## Testing

You can test the WebSocket server using any WebSocket client:

```javascript
const ws = new WebSocket('ws://localhost:8081');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'stt',
    text: 'turn on the lights',
    partial: false
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

## Dependencies

- `ws` - WebSocket server
- `openai` - OpenAI API client (GPT-4o-mini)
- `dotenv` - Environment variable management

## License

MIT
