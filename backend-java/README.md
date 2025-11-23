# Voice Intent Backend (Java/Spring Boot)

A reactive Spring Boot backend that uses WebFlux and WebSockets to receive Speech-to-Text (STT) input, interprets user intent using a local LLM via Ollama, and returns structured action commands to the frontend.

## Architecture

```
Client (Browser)
    ↓ WebSocket
Spring Boot (WebFlux)
    ↓
IntentService → Ollama (Local LLM with Tool Calling)
    ↓
ToolExecutor → ActionResult
    ↓ WebSocket
Client (Browser)
```

## Features

### ✅ Phase 1: WebSocket Foundation
- Reactive WebSocket endpoint at `/ws/intent`
- Built with Spring WebFlux for non-blocking I/O
- JSON-based message protocol

### ✅ Phase 2: Ollama Integration
- **OllamaClient**: HTTP client for communicating with local Ollama API
- **IntentService**: Interprets user intent using LLM with tool calling
- Structured prompts with tool schemas for reliable JSON output
- Automatic response parsing and validation

### ✅ Phase 3: Reactive Processing
- Full integration of IntentService into WebSocket handler
- Reactive pipeline: STT → Intent → Action
- Real-time processing with backpressure support

### ✅ Phase 4: Action Execution
- **ToolExecutor**: Converts tool calls into executable actions
- Supports multiple action types:
  - `NAVIGATE`: Navigate to different pages
  - `SAVE_FORM_FIELD`: Save form field values
  - `BACKEND_TASK`: Trigger backend operations (e.g., emails)
  - `SUBMIT_FORM`: Submit current form
  - `UNKNOWN`: Handle unclear intents gracefully

### ✅ Phase 5: Validation & Error Handling
- **ValidationService**: Input sanitization and tool call validation
- Comprehensive error handling throughout the stack
- JSON validation and format checking
- Parameter validation for each tool type
- Timeout handling for LLM requests

### ✅ Phase 6: Stateful Context
- **ContextService**: Per-session conversation context
- Maintains last 5 conversation turns
- Context-aware intent interpretation
- Automatic cleanup of expired sessions (30-minute timeout)

## Prerequisites

1. **Java 17+**
2. **Maven 3.6+**
3. **Ollama** installed and running locally
   ```bash
   # Install Ollama (https://ollama.ai)

   # Pull a model (e.g., llama3.2:3b)
   ollama pull llama3.2:3b

   # Start Ollama (usually runs on http://localhost:11434)
   ollama serve
   ```

## Quick Start

### 1. Build the Project

```bash
cd backend-java
mvn clean package
```

### 2. Configure (Optional)

Edit `src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8082

# Ollama Configuration
ollama.api.url=http://localhost:11434
ollama.model=llama3.2:3b
ollama.timeout=30000
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

Or run the JAR:

```bash
java -jar target/voice-intent-backend-1.0.0.jar
```

The server will start on `ws://localhost:8082/ws/intent`

### 4. Test the WebSocket

You can test using a WebSocket client or the included frontend. Example message:

```json
{
  "type": "stt",
  "text": "open settings page",
  "partial": false
}
```

Expected response:

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

## Message Protocol

### Client → Server

#### STT Message
```json
{
  "type": "stt",
  "text": "user spoken command",
  "partial": false
}
```

#### Ping Message
```json
{
  "type": "ping"
}
```

### Server → Client

#### System Message (on connect)
```json
{
  "type": "system",
  "message": "Connected to Voice Intent Interpreter (Java/Spring Boot)",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Partial Result
```json
{
  "type": "partial",
  "message": "partial text...",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Action Result
```json
{
  "type": "action_result",
  "intent": "save_form",
  "intentParams": {
    "field": "email",
    "value": "john@example.com"
  },
  "action": "SAVE_FORM_FIELD",
  "field": "email",
  "value": "john@example.com",
  "success": true,
  "interpretTime": 1234,
  "totalTime": 1250,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Error Message
```json
{
  "type": "error",
  "message": "Error description",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Supported Voice Commands

### Navigation
- "open settings page" → Navigate to settings
- "go to login" → Navigate to login
- "show dashboard" → Navigate to dashboard

### Form Operations
- "save email john@example.com" → Save email field
- "set username to alice" → Save username field
- "my name is Bob" → Save name field
- "submit the form" → Submit current form

### Backend Tasks
- "send email to HR" → Trigger email task
- "email support about login issue" → Trigger email with subject/body

## Project Structure

```
backend-java/
├── src/
│   ├── main/
│   │   ├── java/com/voiceapp/
│   │   │   ├── VoiceIntentApplication.java      # Main application
│   │   │   ├── config/
│   │   │   │   └── WebSocketConfig.java         # WebSocket configuration
│   │   │   ├── controller/
│   │   │   │   └── IntentWebSocketHandler.java  # WebSocket handler
│   │   │   ├── service/
│   │   │   │   ├── OllamaClient.java            # Ollama HTTP client
│   │   │   │   ├── IntentService.java           # Intent interpretation
│   │   │   │   ├── ToolExecutor.java            # Action execution
│   │   │   │   ├── ValidationService.java       # Input/output validation
│   │   │   │   └── ContextService.java          # Session context
│   │   │   └── model/
│   │   │       ├── IntentRequest.java
│   │   │       ├── IntentResponse.java
│   │   │       ├── ToolCall.java
│   │   │       ├── ActionResult.java
│   │   │       ├── OllamaRequest.java
│   │   │       ├── OllamaResponse.java
│   │   │       └── ConversationContext.java
│   │   └── resources/
│   │       └── application.properties            # Configuration
│   └── test/
│       └── java/com/voiceapp/                    # Tests (TODO)
├── pom.xml                                        # Maven configuration
├── .gitignore
└── README.md                                      # This file
```

## Configuration Options

| Property | Default | Description |
|----------|---------|-------------|
| `server.port` | `8082` | WebSocket server port |
| `ollama.api.url` | `http://localhost:11434` | Ollama API endpoint |
| `ollama.model` | `llama3.2:3b` | Ollama model to use |
| `ollama.timeout` | `30000` | Request timeout in milliseconds |

## Development

### Building

```bash
mvn clean install
```

### Running Tests

```bash
mvn test
```

### Running in Development Mode

```bash
mvn spring-boot:run
```

### Packaging

```bash
mvn clean package
# Creates: target/voice-intent-backend-1.0.0.jar
```

## Tool Calling Schema

The system uses a structured tool calling approach with the LLM. Available tools:

### 1. navigate
Navigate to a different page.
```json
{
  "tool": "navigate",
  "params": {
    "page": "settings"
  }
}
```

### 2. save_form
Save a form field value.
```json
{
  "tool": "save_form",
  "params": {
    "field": "email",
    "value": "john@example.com"
  }
}
```

### 3. trigger_email
Send a notification email.
```json
{
  "tool": "trigger_email",
  "params": {
    "subject": "Subject line",
    "body": "Email body"
  }
}
```

### 4. submit_form
Submit the current form.
```json
{
  "tool": "submit_form",
  "params": {}
}
```

### 5. unknown
Fallback for unclear intents.
```json
{
  "tool": "unknown",
  "params": {
    "text": "original unclear text"
  }
}
```

## Privacy & Security

- **100% Local Processing**: All LLM inference happens locally via Ollama
- **No External APIs**: No data leaves your machine
- **Input Validation**: All inputs are sanitized and validated
- **Session Isolation**: Each WebSocket session has isolated context
- **Automatic Cleanup**: Expired sessions are automatically removed

## Performance

- **Reactive Architecture**: Non-blocking I/O with Spring WebFlux
- **Backpressure Support**: Handles high load gracefully
- **Connection Pooling**: Efficient HTTP client for Ollama
- **Context Caching**: Maintains conversation state efficiently

## Troubleshooting

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check if model is available
ollama list
```

### WebSocket Connection Issues

- Ensure port 8082 is not in use
- Check firewall settings
- Verify WebSocket URL: `ws://localhost:8082/ws/intent`

### LLM Response Issues

- Try a different model (e.g., `llama3.1:8b`)
- Increase timeout in `application.properties`
- Check Ollama logs for errors

## Comparison with Node.js Backend

| Feature | Node.js Backend | Java Backend |
|---------|----------------|--------------|
| Runtime | Node.js | JVM (Java 17+) |
| Framework | ws library | Spring Boot WebFlux |
| Concurrency | Event loop | Reactive Streams |
| LLM Client | Simple pattern matching or OpenAI | Ollama (local LLM) |
| Type Safety | JavaScript | Java with Lombok |
| Memory | Lower | Higher |
| Startup | Faster | Slower |
| Scalability | Good | Excellent |
| Privacy | Depends on LLM | 100% local |

## Next Steps

- [ ] Add comprehensive unit tests
- [ ] Add integration tests for WebSocket
- [ ] Implement authentication/authorization
- [ ] Add metrics and monitoring (Micrometer)
- [ ] Add distributed tracing (Spring Cloud Sleuth)
- [ ] Support for multiple concurrent LLM models
- [ ] Fine-tune prompts for better intent recognition
- [ ] Add support for custom tool definitions

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please create an issue in the GitHub repository.
