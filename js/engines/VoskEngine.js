/**
 * Vosk WASM Speech Recognition Engine
 * Uses Vosk browser library for on-device speech recognition
 */
class VoskEngine extends STTEngine {
    constructor() {
        super();
        this.voskModel = null;
        this.voskRecognizer = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.audioProcessor = null;
        this.sampleRate = 16000;
        this.modelUrl = null;
    }

    getInfo() {
        return {
            name: 'Vosk',
            version: '0.0.8',
            description: 'Lightweight on-device speech recognition using Vosk WASM',
            features: [
                '100% on-device processing',
                'Works offline after model download',
                'Small model size (~40MB)',
                'Fast real-time recognition',
                'Good accuracy for general speech'
            ],
            requirements: [
                'Vosk WASM library (loaded via CDN)',
                'Local model file served via HTTP'
            ]
        };
    }

    async initialize(config = {}) {
        try {
            this.modelUrl = config.modelUrl || 'http://localhost:8080/vosk-model-small-en-us-0.15.zip';
            this.sampleRate = config.sampleRate || 16000;

            this._emitStatusChange('loading', 'Loading Vosk WASM model...');

            // Create Vosk model with progress callback
            console.log('Creating Vosk model...');
            this.voskModel = await Vosk.createModel(this.modelUrl, {
                onProgress: (progress) => {
                    this._emitProgress(progress);
                    const percentage = Math.round(progress * 100);
                    this._emitStatusChange('loading', `Loading model... ${percentage}%`);
                    console.log(`Model loading: ${percentage}%`);
                }
            });

            console.log('Vosk model loaded successfully');

            // Create recognizer
            this.voskRecognizer = new this.voskModel.KaldiRecognizer(this.sampleRate);
            this.voskRecognizer.setWords(true);

            // Set up result callbacks
            this.voskRecognizer.on("result", (message) => {
                console.log('Vosk final result:', message);
                if (message.result && message.result.text) {
                    const text = message.result.text.trim();
                    if (text) {
                        this._emitFinalResult(text);
                    }
                }
            });

            this.voskRecognizer.on("partialresult", (message) => {
                console.log('Vosk partial result:', message);
                if (message.result && message.result.partial) {
                    const text = message.result.partial.trim();
                    this._emitPartialResult(text || 'Listening...');
                }
            });

            this.isInitialized = true;
            this._emitStatusChange('ready', 'Vosk ready to start');
            console.log('Vosk initialized successfully');

        } catch (error) {
            console.error('Error initializing Vosk:', error);
            this._emitError('Failed to load Vosk model: ' + error.message);
            this._emitStatusChange('error', 'Failed to load model');
            throw error;
        }
    }

    async startListening(audioConfig = {}) {
        if (!this.isInitialized) {
            throw new Error('Engine not initialized. Call initialize() first.');
        }

        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.sampleRate,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate
            });

            // Create media stream source
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Create script processor for audio data
            const bufferSize = 4096;
            this.audioProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

            this.audioProcessor.onaudioprocess = (event) => {
                if (!this.isListening || !this.voskRecognizer) return;

                // Send the entire AudioBuffer to Vosk (it handles conversion internally)
                this.voskRecognizer.acceptWaveform(event.inputBuffer);
            };

            // Connect the audio graph
            source.connect(this.audioProcessor);
            this.audioProcessor.connect(this.audioContext.destination);

            this.isListening = true;
            this._emitStatusChange('listening', 'Listening...');
            this._emitPartialResult('Listening...');

            console.log('Vosk recording started');

        } catch (error) {
            console.error('Error starting Vosk recording:', error);

            let errorMessage = 'Failed to start recording: ' + error.message;
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found. Please connect a microphone and try again.';
            }

            this._emitError(errorMessage);
            await this.stopListening();
            throw error;
        }
    }

    async stopListening() {
        this.isListening = false;

        // Stop audio processing
        if (this.audioProcessor) {
            this.audioProcessor.disconnect();
            this.audioProcessor = null;
        }

        // Stop media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // Close audio context
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }

        this._emitStatusChange('ready', 'Ready to start');
        console.log('Vosk recording stopped');
    }

    processAudio(audioData) {
        if (!this.isListening || !this.voskRecognizer) {
            console.warn('Cannot process audio: not listening or recognizer not ready');
            return;
        }

        this.voskRecognizer.acceptWaveform(audioData);
    }

    destroy() {
        this.stopListening();

        if (this.voskRecognizer) {
            // Vosk recognizer cleanup if needed
            this.voskRecognizer = null;
        }

        if (this.voskModel) {
            // Vosk model cleanup if needed
            this.voskModel = null;
        }

        super.destroy();
        console.log('Vosk engine destroyed');
    }
}
