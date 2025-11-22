# Quick Start Guide - Java Backend

Get the Voice Intent Backend (Java/Spring Boot) running in 5 minutes!

## Prerequisites

1. **Java 17 or higher**
   ```bash
   java -version
   ```

2. **Maven 3.6 or higher**
   ```bash
   mvn -version
   ```

3. **Ollama** (for local LLM)
   ```bash
   # Install from https://ollama.ai
   # Or using curl:
   curl -fsSL https://ollama.com/install.sh | sh
   ```

## Step-by-Step Setup

### 1. Install and Start Ollama

```bash
# Pull a model (we recommend llama3.2:3b for speed)
ollama pull llama3.2:3b

# Start Ollama server (in a separate terminal)
ollama serve
```

Verify Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

### 2. Build the Backend

```bash
cd backend-java
mvn clean package
```

This will:
- Download all dependencies
- Compile the code
- Run tests
- Create an executable JAR

### 3. Run the Backend

**Option A: Using Maven (Development)**
```bash
mvn spring-boot:run
```

**Option B: Using the JAR (Production)**
```bash
java -jar target/voice-intent-backend-1.0.0.jar
```

**Option C: Using the Quick Start Script**
```bash
./run.sh
```

### 4. Verify It's Working

The backend will start on port 8082. You should see:

```
🚀 WebSocket server started on ws://localhost:8082/ws/intent
📡 Ready to receive STT text and interpret intents
🤖 OllamaClient initialized with model: llama3.2:3b
```

### 5. Test the Connection

**Using websocat (WebSocket CLI tool):**
```bash
# Install websocat
# https://github.com/vi/websocat

# Connect and send a test message
echo '{"type":"stt","text":"open settings page","partial":false}' | \
  websocat ws://localhost:8082/ws/intent
```

**Using the Frontend:**

The existing `index.html` should work with minimal changes. Just update the WebSocket URL to:
```javascript
const ws = new WebSocket('ws://localhost:8082/ws/intent');
```

## Testing Voice Commands

Once connected, try these commands:

### Navigation
- "open settings page"
- "go to login"
- "show dashboard"

### Form Operations
- "save email john@example.com"
- "set username to alice"
- "submit the form"

### Backend Tasks
- "send email to HR"
- "email support about login issue"

## Expected Response Format

```json
{
  "type": "action_result",
  "intent": "navigate",
  "intentParams": {
    "page": "settings"
  },
  "action": "NAVIGATE",
  "target": "settings",
  "success": true,
  "interpretTime": 1234,
  "totalTime": 1250,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Configuration

Edit `src/main/resources/application.properties` to customize:

```properties
# Change server port
server.port=8082

# Use a different Ollama model
ollama.model=llama3.1:8b

# Adjust timeout (milliseconds)
ollama.timeout=30000
```

## Troubleshooting

### "Connection refused" to Ollama
- Make sure Ollama is running: `ollama serve`
- Check the URL: `http://localhost:11434`

### "Model not found"
```bash
# Pull the model
ollama pull llama3.2:3b
```

### Port 8082 already in use
Change the port in `application.properties`:
```properties
server.port=8083
```

### Slow responses
- Try a smaller model: `ollama pull phi3:mini`
- Increase timeout in config
- Check system resources

## Running Both Backends

You can run both Node.js and Java backends simultaneously:

1. **Node.js Backend**: Port 8081
   ```bash
   cd backend
   npm start
   ```

2. **Java Backend**: Port 8082
   ```bash
   cd backend-java
   mvn spring-boot:run
   ```

Then switch between them in your frontend by changing the WebSocket URL.

## Next Steps

- Read the full [README.md](README.md) for architecture details
- Explore the code in `src/main/java/com/voiceapp/`
- Try different Ollama models
- Customize the tool calling schema in `IntentService.java`
- Add your own tools in `ToolExecutor.java`

## Support

- Check the logs for detailed error messages
- Enable debug logging: `logging.level.com.voiceapp=DEBUG`
- Create an issue on GitHub for bugs or questions

Happy coding! 🎉
