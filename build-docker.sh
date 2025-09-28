#!/bin/bash

echo "🐳 CCFrame Docker Build Helper"
echo "==============================="

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --memory MB     Set manual memory limit (e.g., 512, 1024, 2048)"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                  # Auto-detect memory"
    echo "  $0 -m 1024          # Use 1GB memory limit"
    echo "  $0 --memory 512     # Use 512MB memory limit"
    echo ""
    echo "For low-memory systems, try:"
    echo "  $0 -m 512           # Conservative build"
    echo "  $0 -m 256           # Minimal build (may be slow)"
}

MEMORY_LIMIT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--memory)
            MEMORY_LIMIT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker and try again"
    exit 1
fi

# Build Docker image
BUILD_ARGS=""
if [ -n "$MEMORY_LIMIT" ]; then
    echo "🔧 Using manual memory limit: ${MEMORY_LIMIT}MB"
    BUILD_ARGS="--build-arg MANUAL_MEMORY_MB=$MEMORY_LIMIT"
fi

echo "🏗️  Starting Docker build..."
echo "Command: docker build $BUILD_ARGS -t ccframe ."

if docker build $BUILD_ARGS -t ccframe .; then
    echo ""
    echo "✅ Build successful!"
    echo "🚀 To run the container:"
    echo "   docker run -p 3000:3000 ccframe"
else
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "💡 Troubleshooting tips:"
    echo "1. Try with lower memory limit: $0 -m 512"
    echo "2. Check available system memory: free -h"
    echo "3. Enable swap if needed: sudo swapon -s"
    echo "4. Clean Docker cache: docker system prune"
    exit 1
fi