/**
 * WebSocket Client for Intent Interpretation
 * Connects to backend server and handles intent processing
 */
class WebSocketClient {
    constructor(url = 'ws://localhost:8081') {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // Start with 2 seconds

        // Callbacks
        this.callbacks = {
            onConnect: [],
            onDisconnect: [],
            onIntent: [],
            onActionResult: [],
            onPartial: [],
            onError: [],
            onStateChange: []
        };
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        try {
            console.log(`🔌 Connecting to WebSocket server: ${this.url}`);
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 2000;
                console.log('✅ WebSocket connected');
                this._emit('onConnect');
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onclose = () => {
                this.connected = false;
                console.log('❌ WebSocket disconnected');
                this._emit('onDisconnect');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('⚠️ WebSocket error:', error);
                this._emit('onError', { message: 'WebSocket connection error' });
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this._emit('onError', { message: 'Failed to create WebSocket connection' });
        }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            this._emit('onError', {
                message: 'Failed to reconnect to server. Please refresh the page.'
            });
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

        console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('📨 Received:', message);

            switch (message.type) {
                case 'system':
                    console.log(`ℹ️ System: ${message.message} (Mode: ${message.mode})`);
                    this._emit('onConnect', message);
                    break;

                case 'partial':
                    this._emit('onPartial', message);
                    break;

                case 'intent':
                    this._emit('onIntent', message);
                    break;

                case 'action_result':
                    this._emit('onActionResult', message);
                    break;

                case 'state':
                    this._emit('onStateChange', message);
                    break;

                case 'error':
                    console.error('Server error:', message.message);
                    this._emit('onError', message);
                    break;

                case 'pong':
                    console.log('🏓 Pong received');
                    break;

                default:
                    console.warn('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    /**
     * Send STT text to server
     */
    sendSTT(text, partial = false) {
        if (!this.connected) {
            console.warn('Cannot send STT: Not connected to server');
            return false;
        }

        if (!text || text.trim().length === 0) {
            return false;
        }

        try {
            const message = {
                type: 'stt',
                text: text.trim(),
                partial: partial,
                timestamp: new Date().toISOString()
            };

            this.ws.send(JSON.stringify(message));
            console.log(`📤 Sent STT (${partial ? 'partial' : 'final'}): "${text}"`);
            return true;
        } catch (error) {
            console.error('Failed to send STT:', error);
            this._emit('onError', { message: 'Failed to send STT text' });
            return false;
        }
    }

    /**
     * Send ping to server
     */
    ping() {
        if (!this.connected) {
            return false;
        }

        try {
            this.ws.send(JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString()
            }));
            return true;
        } catch (error) {
            console.error('Failed to send ping:', error);
            return false;
        }
    }

    /**
     * Request current device state
     */
    getState() {
        if (!this.connected) {
            return false;
        }

        try {
            this.ws.send(JSON.stringify({
                type: 'get_state',
                timestamp: new Date().toISOString()
            }));
            return true;
        } catch (error) {
            console.error('Failed to get state:', error);
            return false;
        }
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }

    /**
     * Register callback
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Emit event to callbacks
     */
    _emit(event, data = null) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} callback:`, error);
                }
            });
        }
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
}
