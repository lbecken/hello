/**
 * WebSocket Server for STT Intent Interpretation
 * Receives STT text from browser, interprets intent, executes actions
 */

import { WebSocketServer } from 'ws';
import IntentInterpreter from './intentInterpreter.js';
import ActionExecutor from './actionExecutor.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8081;

// Initialize services
const intentInterpreter = new IntentInterpreter();
const actionExecutor = new ActionExecutor();

// Create WebSocket server
const wss = new WebSocketServer({
    port: PORT,
    host: '0.0.0.0'  // Listen on all network interfaces
});

console.log(`🚀 WebSocket server started on ws://localhost:${PORT}`);
console.log(`📡 Ready to receive STT text and interpret intents`);
console.log(`🤖 Mode: ${intentInterpreter.mode}`);

// Connection counter for logging
let connectionId = 0;

wss.on('connection', (ws) => {
    const clientId = ++connectionId;
    console.log(`\n✅ Client #${clientId} connected`);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'system',
        message: 'Connected to Intent Interpreter',
        mode: intentInterpreter.mode,
        timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log(`\n📨 Client #${clientId} message:`, message);

            // Handle different message types
            switch (message.type) {
                case 'stt':
                    await handleSTT(ws, message);
                    break;

                case 'ping':
                    ws.send(JSON.stringify({
                        type: 'pong',
                        timestamp: new Date().toISOString()
                    }));
                    break;

                case 'get_state':
                    ws.send(JSON.stringify({
                        type: 'state',
                        state: actionExecutor.getState(),
                        timestamp: new Date().toISOString()
                    }));
                    break;

                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Unknown message type: ${message.type}`,
                        timestamp: new Date().toISOString()
                    }));
            }
        } catch (error) {
            console.error(`❌ Error processing message from client #${clientId}:`, error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format',
                error: error.message,
                timestamp: new Date().toISOString()
            }));
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        console.log(`\n❌ Client #${clientId} disconnected`);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`\n⚠️ Client #${clientId} error:`, error);
    });
});

/**
 * Handle STT text from client
 */
async function handleSTT(ws, message) {
    const { text, partial = false } = message;

    if (!text || text.trim().length === 0) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Empty STT text',
            timestamp: new Date().toISOString()
        }));
        return;
    }

    console.log(`🎤 STT Text (${partial ? 'partial' : 'final'}): "${text}"`);

    // For partial results, just echo back
    if (partial) {
        ws.send(JSON.stringify({
            type: 'partial',
            text: text,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // For final results, interpret intent and execute action
    try {
        // Step 1: Interpret intent
        console.log(`🤔 Interpreting intent...`);
        const startTime = Date.now();
        const intent = await intentInterpreter.interpret(text);
        const interpretTime = Date.now() - startTime;

        console.log(`✨ Intent:`, intent);
        console.log(`⏱️ Interpretation time: ${interpretTime}ms`);

        // Send interpreted intent to client
        ws.send(JSON.stringify({
            type: 'intent',
            intent: intent,
            processingTime: interpretTime,
            timestamp: new Date().toISOString()
        }));

        // Step 2: Execute action (if intent is known)
        if (intent.intent !== 'UNKNOWN' && intent.intent !== 'ERROR') {
            console.log(`⚙️ Executing action...`);
            const actionStartTime = Date.now();
            const result = await actionExecutor.execute(intent);
            const actionTime = Date.now() - actionStartTime;

            console.log(`📤 Action result:`, result);
            console.log(`⏱️ Action time: ${actionTime}ms`);

            // Send action result to client
            ws.send(JSON.stringify({
                type: 'action_result',
                result: result,
                intent: intent,
                processingTime: actionTime,
                totalTime: interpretTime + actionTime,
                timestamp: new Date().toISOString()
            }));
        }
    } catch (error) {
        console.error(`❌ Error handling STT:`, error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process STT text',
            error: error.message,
            timestamp: new Date().toISOString()
        }));
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down WebSocket server...');
    wss.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
