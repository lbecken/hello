/**
 * Action Executor
 * Executes actions based on interpreted intents
 */

class ActionExecutor {
    constructor() {
        // Simulated device states
        this.deviceState = {
            lights: false,
            temperature: 72,
            musicPlaying: false,
            currentSong: null,
            activeTimers: []
        };
    }

    /**
     * Execute an action based on intent
     * @param {object} intent - The interpreted intent
     * @returns {Promise<object>} - Result of the action
     */
    async execute(intent) {
        console.log(`Executing intent: ${intent.intent}`);

        try {
            switch (intent.intent) {
                case 'TURN_ON_LIGHT':
                    return this.turnOnLight();

                case 'TURN_OFF_LIGHT':
                    return this.turnOffLight();

                case 'SEARCH_WEATHER':
                    return this.getWeather(intent.parameters);

                case 'PLAY_MUSIC':
                    return this.playMusic(intent.parameters);

                case 'SET_TIMER':
                    return this.setTimer(intent.parameters);

                case 'SET_TEMPERATURE':
                    return this.setTemperature(intent.parameters);

                default:
                    return {
                        success: false,
                        message: `Unknown intent: ${intent.intent}`,
                        suggestion: 'Try saying "turn on the lights" or "what\'s the weather"'
                    };
            }
        } catch (error) {
            console.error('Action execution error:', error);
            return {
                success: false,
                message: `Error executing action: ${error.message}`
            };
        }
    }

    /**
     * Turn on lights
     */
    turnOnLight() {
        this.deviceState.lights = true;
        return {
            success: true,
            message: '💡 Lights turned ON',
            state: { lights: this.deviceState.lights }
        };
    }

    /**
     * Turn off lights
     */
    turnOffLight() {
        this.deviceState.lights = false;
        return {
            success: true,
            message: '🌙 Lights turned OFF',
            state: { lights: this.deviceState.lights }
        };
    }

    /**
     * Get weather information (simulated)
     */
    async getWeather(params = {}) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock weather data
        const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const temp = Math.floor(Math.random() * 30) + 50; // 50-80°F

        return {
            success: true,
            message: `🌤️ Weather: ${condition}, ${temp}°F`,
            data: {
                condition,
                temperature: temp,
                humidity: Math.floor(Math.random() * 40) + 40,
                location: params.location || 'Current Location'
            }
        };
    }

    /**
     * Play music
     */
    playMusic(params = {}) {
        this.deviceState.musicPlaying = true;
        this.deviceState.currentSong = params.query || 'Random Song';

        return {
            success: true,
            message: `🎵 Playing: ${this.deviceState.currentSong}`,
            state: {
                musicPlaying: this.deviceState.musicPlaying,
                currentSong: this.deviceState.currentSong
            }
        };
    }

    /**
     * Set a timer
     */
    setTimer(params = {}) {
        const minutes = params.minutes || 0;
        const seconds = params.seconds || 0;
        const totalSeconds = minutes * 60 + seconds;

        if (totalSeconds === 0) {
            return {
                success: false,
                message: '❌ Please specify a duration (e.g., "set timer for 5 minutes")'
            };
        }

        const timer = {
            id: Date.now(),
            duration: totalSeconds,
            remaining: totalSeconds
        };

        this.deviceState.activeTimers.push(timer);

        return {
            success: true,
            message: `⏱️ Timer set for ${minutes}m ${seconds}s`,
            state: {
                timer: timer
            }
        };
    }

    /**
     * Set temperature
     */
    setTemperature(params = {}) {
        if (!params.value) {
            return {
                success: false,
                message: '❌ Please specify a temperature (e.g., "set temperature to 72 degrees")'
            };
        }

        this.deviceState.temperature = params.value;

        return {
            success: true,
            message: `🌡️ Temperature set to ${params.value}°F`,
            state: {
                temperature: this.deviceState.temperature
            }
        };
    }

    /**
     * Get current device state
     */
    getState() {
        return { ...this.deviceState };
    }
}

export default ActionExecutor;
