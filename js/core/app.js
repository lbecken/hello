/**
 * Main Application Logic
 * Manages UI, engine selection, and coordinates STT engines
 */
class SpeechToTextApp {
    constructor() {
        // Available engines
        this.engines = {
            vosk: null,
            whisper: null
        };

        this.currentEngine = null;
        this.currentEngineName = null;
        this.finalTranscript = '';

        // DOM Elements
        this.elements = {
            engineSelector: document.getElementById('engineSelector'),
            recordButton: document.getElementById('recordButton'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            interimResults: document.getElementById('interimResults'),
            finalResults: document.getElementById('finalResults'),
            errorMessage: document.getElementById('errorMessage'),
            historyContainer: document.getElementById('historyContainer'),
            loadingProgress: document.getElementById('loadingProgress'),
            loadingProgressBar: document.getElementById('loadingProgressBar'),
            engineInfo: document.getElementById('engineInfo')
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Speech-to-Text App...');

        // Set up event listeners
        this.setupEventListeners();

        // Register available engines
        this.registerEngines();

        // Load default engine (Vosk)
        await this.switchEngine('vosk');
    }

    /**
     * Register available STT engines
     */
    registerEngines() {
        // Check if VoskEngine is available
        if (typeof VoskEngine !== 'undefined') {
            this.engines.vosk = new VoskEngine();
            console.log('VoskEngine registered');
        }

        // Check if WhisperEngine is available
        if (typeof WhisperEngine !== 'undefined') {
            this.engines.whisper = new WhisperEngine();
            console.log('WhisperEngine registered');
        }
    }

    /**
     * Switch to a different STT engine
     */
    async switchEngine(engineName) {
        console.log(`Switching to ${engineName} engine...`);

        // Stop current engine if running
        if (this.currentEngine && this.currentEngine.isListening) {
            await this.currentEngine.stopListening();
        }

        // Check if engine exists
        if (!this.engines[engineName]) {
            this.showError(`Engine "${engineName}" not available`);
            return;
        }

        // Set new engine
        this.currentEngine = this.engines[engineName];
        this.currentEngineName = engineName;

        // Update UI
        if (this.elements.engineSelector) {
            this.elements.engineSelector.value = engineName;
        }

        // Display engine info
        this.displayEngineInfo();

        // Set up engine callbacks
        this.setupEngineCallbacks();

        // Initialize engine if not already initialized
        if (!this.currentEngine.isInitialized) {
            await this.initializeCurrentEngine();
        } else {
            this.updateStatus('ready', `${this.currentEngine.getInfo().name} ready to start`);
            this.elements.recordButton.disabled = false;
            this.elements.recordButton.textContent = 'Start Recording';
        }
    }

    /**
     * Initialize the current engine
     */
    async initializeCurrentEngine() {
        if (!this.currentEngine) return;

        try {
            const engineInfo = this.currentEngine.getInfo();
            console.log(`Initializing ${engineInfo.name}...`);

            // Engine-specific configuration
            let config = {};
            if (this.currentEngineName === 'vosk') {
                config.modelUrl = 'http://localhost:8080/vosk-model-small-en-us-0.15.zip';
                config.sampleRate = 16000;
            } else if (this.currentEngineName === 'whisper') {
                config.modelUrl = 'http://localhost:8080/ggml-tiny.en.bin';
                config.sampleRate = 16000;
                config.maxChunkDuration = 30;
            }

            this.elements.recordButton.disabled = true;
            this.elements.recordButton.textContent = 'Loading Model...';

            await this.currentEngine.initialize(config);

            this.elements.recordButton.disabled = false;
            this.elements.recordButton.textContent = 'Start Recording';

        } catch (error) {
            console.error('Failed to initialize engine:', error);
            this.showError('Failed to initialize engine. Please refresh and try again.');
        }
    }

    /**
     * Set up engine callbacks
     */
    setupEngineCallbacks() {
        if (!this.currentEngine) return;

        // Partial results
        this.currentEngine.onPartialResult((text) => {
            this.elements.interimResults.textContent = text;
            this.elements.interimResults.classList.remove('empty');
        });

        // Final results
        this.currentEngine.onFinalResult((text) => {
            this.finalTranscript += text + ' ';
            this.elements.finalResults.textContent = this.finalTranscript;
            this.elements.finalResults.classList.remove('empty');
            this.addToHistory(text);
        });

        // Errors
        this.currentEngine.onError((error) => {
            this.showError(error);
        });

        // Status changes
        this.currentEngine.onStatusChange((status, message) => {
            this.updateStatus(status, message);
        });

        // Progress updates
        this.currentEngine.onProgress((progress) => {
            this.elements.loadingProgress.classList.add('show');
            this.elements.loadingProgressBar.style.width = (progress * 100) + '%';

            if (progress >= 1) {
                setTimeout(() => {
                    this.elements.loadingProgress.classList.remove('show');
                }, 500);
            }
        });
    }

    /**
     * Set up UI event listeners
     */
    setupEventListeners() {
        // Record button
        this.elements.recordButton.addEventListener('click', () => {
            this.toggleRecording();
        });

        // Engine selector
        if (this.elements.engineSelector) {
            this.elements.engineSelector.addEventListener('change', (e) => {
                this.switchEngine(e.target.value);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // Space bar to toggle recording
            if (event.code === 'Space' &&
                event.target === document.body &&
                !this.elements.recordButton.disabled) {
                event.preventDefault();
                this.toggleRecording();
            }
        });
    }

    /**
     * Toggle recording on/off
     */
    async toggleRecording() {
        if (!this.currentEngine) {
            this.showError('No engine selected');
            return;
        }

        if (this.currentEngine.isListening) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    /**
     * Start recording
     */
    async startRecording() {
        try {
            // Clear previous results
            this.finalTranscript = '';
            this.elements.interimResults.textContent = 'Listening...';
            this.elements.interimResults.classList.remove('empty');
            this.elements.errorMessage.classList.remove('show');

            // Update button
            this.elements.recordButton.textContent = 'Stop Recording';
            this.elements.recordButton.classList.add('listening');

            // Start engine
            await this.currentEngine.startListening();

            console.log('Recording started');

        } catch (error) {
            console.error('Failed to start recording:', error);
            this.stopRecording();
        }
    }

    /**
     * Stop recording
     */
    async stopRecording() {
        try {
            // Stop engine
            await this.currentEngine.stopListening();

            // Update button
            this.elements.recordButton.textContent = 'Start Recording';
            this.elements.recordButton.classList.remove('listening');

            // Reset interim results
            if (!this.finalTranscript) {
                this.elements.interimResults.textContent = 'Partial text will appear here as you speak...';
                this.elements.interimResults.classList.add('empty');
            } else {
                this.elements.interimResults.textContent = 'Click "Start Recording" to continue...';
                this.elements.interimResults.classList.remove('empty');
            }

            console.log('Recording stopped');

        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    }

    /**
     * Update status indicator
     */
    updateStatus(state, text) {
        this.elements.statusText.textContent = text;
        this.elements.statusIndicator.className = 'status-indicator';

        if (state === 'listening' || state === 'loading') {
            this.elements.statusIndicator.classList.add(state);
        } else if (state === 'ready') {
            this.elements.statusIndicator.classList.add('ready');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.add('show');

        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.elements.errorMessage.classList.remove('show');
        }, 10000);
    }

    /**
     * Add transcript to history
     */
    addToHistory(transcript) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const timestamp = document.createElement('div');
        timestamp.className = 'history-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();

        const text = document.createElement('div');
        text.textContent = transcript;

        historyItem.appendChild(timestamp);
        historyItem.appendChild(text);

        this.elements.historyContainer.insertBefore(
            historyItem,
            this.elements.historyContainer.firstChild
        );

        // Limit history to 10 items
        while (this.elements.historyContainer.children.length > 10) {
            this.elements.historyContainer.removeChild(
                this.elements.historyContainer.lastChild
            );
        }
    }

    /**
     * Display current engine information
     */
    displayEngineInfo() {
        if (!this.currentEngine || !this.elements.engineInfo) return;

        const info = this.currentEngine.getInfo();

        let html = `<strong>🎤 ${info.name}</strong>`;

        if (info.features && info.features.length > 0) {
            html += '<ul class="features-list">';
            info.features.forEach(feature => {
                html += `<li>${feature}</li>`;
            });
            html += '</ul>';
        }

        if (info.notes && info.notes.length > 0) {
            html += '<div class="engine-notes">';
            info.notes.forEach(note => {
                html += `<div class="note">ℹ️ ${note}</div>`;
            });
            html += '</div>';
        }

        this.elements.engineInfo.innerHTML = html;
    }
}

// Initialize app when page loads
let app;
window.addEventListener('load', () => {
    app = new SpeechToTextApp();
    app.init();
});
