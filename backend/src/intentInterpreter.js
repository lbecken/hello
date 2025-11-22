/**
 * Intent Interpreter Service
 * Uses LLM to interpret STT text and extract structured intent
 */

import OpenAI from 'openai';

class IntentInterpreter {
    constructor(apiKey = null) {
        // Support both OpenAI API and local models
        this.apiKey = apiKey || process.env.OPENAI_API_KEY;

        if (this.apiKey) {
            this.client = new OpenAI({
                apiKey: this.apiKey
            });
            this.mode = 'openai';
        } else {
            // Fallback to simple pattern matching
            this.mode = 'pattern';
            console.warn('No OpenAI API key found, using pattern matching mode');
        }
    }

    /**
     * Interpret text and extract intent
     * @param {string} text - The STT text to interpret
     * @returns {Promise<object>} - Structured intent object
     */
    async interpret(text) {
        if (!text || text.trim().length === 0) {
            return {
                intent: 'UNKNOWN',
                confidence: 0,
                target: null,
                action: null,
                error: 'Empty input'
            };
        }

        try {
            if (this.mode === 'openai') {
                return await this.interpretWithLLM(text);
            } else {
                return this.interpretWithPatterns(text);
            }
        } catch (error) {
            console.error('Intent interpretation error:', error);
            return {
                intent: 'ERROR',
                confidence: 0,
                target: null,
                action: null,
                error: error.message
            };
        }
    }

    /**
     * Use OpenAI LLM for intent interpretation
     */
    async interpretWithLLM(text) {
        const systemPrompt = `You are an intent classifier for a voice-controlled assistant.
Extract structured intent from user speech.

Return JSON with this exact structure:
{
  "intent": "INTENT_NAME",
  "action": "action_verb",
  "target": "target_object",
  "parameters": {},
  "confidence": 0.0-1.0
}

Common intents:
- TURN_ON_LIGHT / TURN_OFF_LIGHT
- SET_TEMPERATURE
- PLAY_MUSIC
- SEARCH_WEATHER
- SET_TIMER
- SEND_MESSAGE
- UNKNOWN (if unclear)

Examples:
Input: "turn on the lights"
Output: {"intent": "TURN_ON_LIGHT", "action": "turn_on", "target": "lights", "parameters": {}, "confidence": 0.95}

Input: "what's the weather like"
Output: {"intent": "SEARCH_WEATHER", "action": "search", "target": "weather", "parameters": {}, "confidence": 0.9}`;

        const response = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_tokens: 200,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return {
            intent: result.intent || 'UNKNOWN',
            action: result.action || null,
            target: result.target || null,
            parameters: result.parameters || {},
            confidence: result.confidence || 0.5,
            raw_text: text
        };
    }

    /**
     * Fallback: Simple pattern matching for common intents
     */
    interpretWithPatterns(text) {
        const lowerText = text.toLowerCase().trim();

        // Light control patterns
        if (/turn on.*light|lights? on|switch on.*light/i.test(lowerText)) {
            return {
                intent: 'TURN_ON_LIGHT',
                action: 'turn_on',
                target: 'lights',
                parameters: {},
                confidence: 0.8,
                raw_text: text
            };
        }

        if (/turn off.*light|lights? off|switch off.*light/i.test(lowerText)) {
            return {
                intent: 'TURN_OFF_LIGHT',
                action: 'turn_off',
                target: 'lights',
                parameters: {},
                confidence: 0.8,
                raw_text: text
            };
        }

        // Weather patterns
        if (/weather|forecast|temperature outside|how.*hot|how.*cold/i.test(lowerText)) {
            return {
                intent: 'SEARCH_WEATHER',
                action: 'search',
                target: 'weather',
                parameters: {},
                confidence: 0.75,
                raw_text: text
            };
        }

        // Music patterns
        if (/play.*music|play.*song|start.*music/i.test(lowerText)) {
            const match = lowerText.match(/play\s+(.+)/);
            return {
                intent: 'PLAY_MUSIC',
                action: 'play',
                target: 'music',
                parameters: {
                    query: match ? match[1] : ''
                },
                confidence: 0.7,
                raw_text: text
            };
        }

        // Timer patterns
        if (/set.*timer|timer.*for|start.*timer/i.test(lowerText)) {
            const minutesMatch = lowerText.match(/(\d+)\s*minute/);
            const secondsMatch = lowerText.match(/(\d+)\s*second/);
            return {
                intent: 'SET_TIMER',
                action: 'set',
                target: 'timer',
                parameters: {
                    minutes: minutesMatch ? parseInt(minutesMatch[1]) : 0,
                    seconds: secondsMatch ? parseInt(secondsMatch[1]) : 0
                },
                confidence: 0.7,
                raw_text: text
            };
        }

        // Temperature patterns
        if (/set.*temperature|temperature.*to|make it.*warm|make it.*cool/i.test(lowerText)) {
            const tempMatch = lowerText.match(/(\d+)\s*degree/);
            return {
                intent: 'SET_TEMPERATURE',
                action: 'set',
                target: 'temperature',
                parameters: {
                    value: tempMatch ? parseInt(tempMatch[1]) : null
                },
                confidence: 0.7,
                raw_text: text
            };
        }

        // Unknown intent
        return {
            intent: 'UNKNOWN',
            action: null,
            target: null,
            parameters: {},
            confidence: 0.3,
            raw_text: text,
            suggestion: 'Try commands like: "turn on the lights", "what\'s the weather", "play music"'
        };
    }
}

export default IntentInterpreter;
