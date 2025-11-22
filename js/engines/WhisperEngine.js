/**
 * Whisper.cpp WASM Speech Recognition Engine
 * Uses Whisper.cpp WebAssembly for high-quality on-device speech recognition
 */
class WhisperEngine extends STTEngine {
    constructor() {
        super();
        this.whisperInstance = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.audioProcessor = null;
        this.sampleRate = 16000;
        this.modelUrl = null;
        this.audioChunks = [];
        this.maxChunkDuration = 30; // seconds
        this.isProcessing = false;
    }

    getInfo() {
        return {
            name: 'Whisper.cpp',
            version: '1.5.0',
            description: 'High-quality speech recognition using OpenAI Whisper WASM',
            features: [
                '100% on-device processing',
                'State-of-the-art accuracy',
                'Works offline after model download',
                'Multi-language support',
                'Punctuation and capitalization'
            ],
            requirements: [
                'Whisper.cpp WASM library',
                'Whisper model file (tiny, base, small, etc.)'
            ],
            notes: [
                'Processes audio in chunks (not real-time streaming)',
                'Higher accuracy but slower than Vosk',
                'Larger model sizes (~75MB for tiny model)'
            ]
        };
    }

    async initialize(config = {}) {
        try {
            this.modelUrl = config.modelUrl || 'http://localhost:8080/ggml-tiny.en.bin';
            this.sampleRate = config.sampleRate || 16000;
            this.maxChunkDuration = config.maxChunkDuration || 30;

            this._emitStatusChange('loading', 'Loading Whisper WASM model...');

            // Check if whisper.cpp WASM is available
            if (typeof createWhisperModule === 'undefined') {
                throw new Error('Whisper WASM library not loaded. Please include whisper.cpp WASM script.');
            }

            console.log('Initializing Whisper.cpp module...');

            // Initialize Whisper WASM module
            this.whisperInstance = await createWhisperModule({
                print: (text) => console.log('Whisper:', text),
                printErr: (text) => console.error('Whisper error:', text),
                onProgress: (progress) => {
                    this._emitProgress(progress);
                    const percentage = Math.round(progress * 100);
                    this._emitStatusChange('loading', `Loading model... ${percentage}%`);
                }
            });

            console.log('Loading Whisper model from:', this.modelUrl);

            // Load the model
            const modelResponse = await fetch(this.modelUrl);
            if (!modelResponse.ok) {
                throw new Error(`Failed to fetch model: ${modelResponse.statusText}`);
            }

            const modelBuffer = await modelResponse.arrayBuffer();
            console.log(`Model loaded: ${modelBuffer.byteLength} bytes`);

            // Initialize Whisper with the model
            const result = await this.whisperInstance.init(new Uint8Array(modelBuffer));
            if (!result) {
                throw new Error('Failed to initialize Whisper with model');
            }

            this.isInitialized = true;
            this._emitStatusChange('ready', 'Whisper ready to start');
            console.log('Whisper initialized successfully');

        } catch (error) {
            console.error('Error initializing Whisper:', error);
            this._emitError('Failed to load Whisper model: ' + error.message);
            this._emitStatusChange('error', 'Failed to load model');
            throw error;
        }
    }

    async startListening(audioConfig = {}) {
        if (!this.isInitialized) {
            throw new Error('Engine not initialized. Call initialize() first.');
        }

        try {
            // Clear previous audio chunks
            this.audioChunks = [];

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
                if (!this.isListening) return;

                // Collect audio data for batch processing
                const inputData = event.inputBuffer.getChannelData(0);
                const chunk = new Float32Array(inputData);
                this.audioChunks.push(chunk);

                // Calculate total duration
                const totalSamples = this.audioChunks.reduce((sum, c) => sum + c.length, 0);
                const duration = totalSamples / this.sampleRate;

                // Process chunk when reaching max duration
                if (duration >= this.maxChunkDuration && !this.isProcessing) {
                    this._processAudioChunk();
                }

                // Emit partial status
                this._emitPartialResult(`Recording... (${Math.round(duration)}s)`);
            };

            // Connect the audio graph
            source.connect(this.audioProcessor);
            this.audioProcessor.connect(this.audioContext.destination);

            this.isListening = true;
            this._emitStatusChange('listening', 'Listening...');
            this._emitPartialResult('Listening...');

            console.log('Whisper recording started');

        } catch (error) {
            console.error('Error starting Whisper recording:', error);

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

        // Process any remaining audio
        if (this.audioChunks.length > 0 && !this.isProcessing) {
            await this._processAudioChunk();
        }

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
        console.log('Whisper recording stopped');
    }

    async _processAudioChunk() {
        if (this.audioChunks.length === 0 || !this.whisperInstance) return;

        this.isProcessing = true;
        this._emitPartialResult('Processing with Whisper...');

        try {
            // Concatenate all audio chunks
            const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const audioData = new Float32Array(totalLength);
            let offset = 0;
            for (const chunk of this.audioChunks) {
                audioData.set(chunk, offset);
                offset += chunk.length;
            }

            console.log(`Processing ${audioData.length} samples (${audioData.length / this.sampleRate}s)`);

            // Run Whisper inference
            const result = await this.whisperInstance.transcribe(audioData);

            if (result && result.text) {
                const text = result.text.trim();
                console.log('Whisper transcription:', text);
                this._emitFinalResult(text);
            }

            // Clear processed chunks
            this.audioChunks = [];

        } catch (error) {
            console.error('Error processing audio with Whisper:', error);
            this._emitError('Failed to process audio: ' + error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    processAudio(audioData) {
        // For Whisper, we collect chunks and process them in batches
        if (!this.isListening) {
            console.warn('Cannot process audio: not listening');
            return;
        }

        // Convert to Float32Array if needed
        let float32Data;
        if (audioData instanceof Float32Array) {
            float32Data = audioData;
        } else if (audioData instanceof Int16Array) {
            float32Data = new Float32Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                float32Data[i] = audioData[i] / 32768.0;
            }
        } else if (audioData instanceof AudioBuffer) {
            float32Data = audioData.getChannelData(0);
        } else {
            console.error('Unsupported audio data format');
            return;
        }

        this.audioChunks.push(float32Data);
    }

    destroy() {
        this.stopListening();

        if (this.whisperInstance) {
            // Cleanup Whisper instance if needed
            this.whisperInstance = null;
        }

        this.audioChunks = [];
        super.destroy();
        console.log('Whisper engine destroyed');
    }
}
