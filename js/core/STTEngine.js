/**
 * Base class for Speech-to-Text engines
 * All STT engine plugins must extend this class and implement its methods
 */
class STTEngine {
    constructor() {
        this.isInitialized = false;
        this.isListening = false;
        this.callbacks = {
            onPartialResult: null,
            onFinalResult: null,
            onError: null,
            onStatusChange: null,
            onProgress: null
        };
    }

    /**
     * Get engine metadata
     * @returns {Object} Engine information
     */
    getInfo() {
        throw new Error('getInfo() must be implemented by subclass');
    }

    /**
     * Initialize the STT engine
     * @param {Object} config - Engine-specific configuration
     * @returns {Promise<void>}
     */
    async initialize(config = {}) {
        throw new Error('initialize() must be implemented by subclass');
    }

    /**
     * Start listening for speech
     * @param {Object} audioConfig - Audio configuration (sample rate, channels, etc.)
     * @returns {Promise<void>}
     */
    async startListening(audioConfig = {}) {
        throw new Error('startListening() must be implemented by subclass');
    }

    /**
     * Stop listening and clean up resources
     * @returns {Promise<void>}
     */
    async stopListening() {
        throw new Error('stopListening() must be implemented by subclass');
    }

    /**
     * Process audio data
     * @param {AudioBuffer|Float32Array|Int16Array} audioData - Audio data to process
     */
    processAudio(audioData) {
        throw new Error('processAudio() must be implemented by subclass');
    }

    /**
     * Clean up and release all resources
     */
    destroy() {
        this.isInitialized = false;
        this.isListening = false;
        this.callbacks = {};
    }

    /**
     * Set callback for partial (interim) results
     * @param {Function} callback - Function to call with partial text
     */
    onPartialResult(callback) {
        this.callbacks.onPartialResult = callback;
    }

    /**
     * Set callback for final results
     * @param {Function} callback - Function to call with final text
     */
    onFinalResult(callback) {
        this.callbacks.onFinalResult = callback;
    }

    /**
     * Set callback for errors
     * @param {Function} callback - Function to call with error
     */
    onError(callback) {
        this.callbacks.onError = callback;
    }

    /**
     * Set callback for status changes
     * @param {Function} callback - Function to call with status updates
     */
    onStatusChange(callback) {
        this.callbacks.onStatusChange = callback;
    }

    /**
     * Set callback for progress updates (e.g., model loading)
     * @param {Function} callback - Function to call with progress (0-1)
     */
    onProgress(callback) {
        this.callbacks.onProgress = callback;
    }

    /**
     * Emit partial result to callback
     * @protected
     */
    _emitPartialResult(text) {
        if (this.callbacks.onPartialResult) {
            this.callbacks.onPartialResult(text);
        }
    }

    /**
     * Emit final result to callback
     * @protected
     */
    _emitFinalResult(text) {
        if (this.callbacks.onFinalResult) {
            this.callbacks.onFinalResult(text);
        }
    }

    /**
     * Emit error to callback
     * @protected
     */
    _emitError(error) {
        if (this.callbacks.onError) {
            this.callbacks.onError(error);
        }
    }

    /**
     * Emit status change to callback
     * @protected
     */
    _emitStatusChange(status, message) {
        if (this.callbacks.onStatusChange) {
            this.callbacks.onStatusChange(status, message);
        }
    }

    /**
     * Emit progress update to callback
     * @protected
     */
    _emitProgress(progress) {
        if (this.callbacks.onProgress) {
            this.callbacks.onProgress(progress);
        }
    }
}
