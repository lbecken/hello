#!/bin/bash
# Quick start script for Voice Intent Backend (Java)

echo "🚀 Starting Voice Intent Backend (Java/Spring Boot)"
echo ""

# Check if Ollama is running
echo "🔍 Checking Ollama connection..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama is not running!"
    echo "Please start Ollama first:"
    echo "  ollama serve"
    echo ""
    echo "And pull a model if you haven't already:"
    echo "  ollama pull llama3.2:3b"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed!"
    echo "Please install Maven 3.6+ first"
    exit 1
fi

# Build and run
echo ""
echo "📦 Building and starting the application..."
mvn spring-boot:run
