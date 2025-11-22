# Phase 3 Quick Start Guide

Get up and running with WebSocket Intent Interpretation in 5 minutes!

## ⚡ Quick Setup

### 1. Install Backend Dependencies (30 seconds)

```bash
cd backend
npm install
```

### 2. Start Backend Server (10 seconds)

```bash
npm start
```

You should see:
```
🚀 WebSocket server started on ws://localhost:8081
📡 Ready to receive STT text and interpret intents
🤖 Mode: pattern
```

**Note:** Backend works in pattern mode without API key!

### 3. Start Frontend Server (10 seconds)

Open a **new terminal** in project root:

```bash
python3 -m http.server 8080
```

Or with Node.js:
```bash
npx serve -p 8080 .
```

### 4. Open Browser (5 seconds)

Navigate to: **http://localhost:8080**

Wait for Vosk model to load (~40MB, first time only)

### 5. Test It! (1 minute)

1. Look for **"🟢 Connected (pattern mode)"**
2. Click **"Start Recording"**
3. Say: **"turn on the lights"**
4. Watch the magic:
   - **Partial Results:** Shows real-time transcription
   - **Final Results:** Complete text
   - **Intent:** TURN_ON_LIGHT (80% confident)
   - **Action Result:** 💡 Lights turned ON

## 🎯 Try These Commands

- "turn off the lights"
- "what's the weather"
- "play music"
- "set timer for 5 minutes"

## 🔑 Optional: Enable LLM Mode

For better intent recognition:

1. Get OpenAI API key: https://platform.openai.com/api-keys

2. Create `.env` file:
```bash
cd backend
cp .env.example .env
```

3. Edit `.env`:
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

4. Restart backend:
```bash
npm start
```

Now you'll see: **"🟢 Connected (openai mode)"**

## 🐛 Quick Troubleshooting

**Backend won't start?**
- Make sure you ran `npm install` in the `backend/` directory

**WebSocket won't connect?**
- Check that backend is running (should show WebSocket server started)
- Make sure port 8081 is not in use

**No microphone access?**
- Grant microphone permission in browser
- Ensure microphone is connected

**Intent not recognized?**
- In pattern mode: Use exact commands from list above
- In openai mode: Can understand variations

## 📚 Next Steps

- Read [PHASE3.md](PHASE3.md) for detailed architecture
- Read [backend/README.md](backend/README.md) for backend details
- Customize intents in `backend/src/intentInterpreter.js`
- Add new actions in `backend/src/actionExecutor.js`

## 🎉 That's It!

You now have a working voice-controlled assistant with:
- ✅ On-device speech recognition
- ✅ Real-time WebSocket communication
- ✅ LLM intent interpretation
- ✅ Action execution
- ✅ Live UI updates

**Total setup time:** ~5 minutes
