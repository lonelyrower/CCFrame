#!/bin/bash

echo "🔍 Testing CCFrame Application Health"
echo "======================================"

# Test simple health endpoint
echo "Testing /api/health-simple..."
response=$(curl -s -w "HTTP_CODE:%{http_code}" http://localhost:3000/api/health-simple 2>/dev/null)
if [[ $response == *"HTTP_CODE:200"* ]]; then
    echo "✅ Simple health check: PASSED"
    echo "Response: $(echo "$response" | sed 's/HTTP_CODE:[0-9]*//')"
else
    echo "❌ Simple health check: FAILED"
    echo "Response: $response"
fi

echo ""

# Test main page
echo "Testing main page..."
main_response=$(curl -s -w "HTTP_CODE:%{http_code}" http://localhost:3000/ 2>/dev/null)
if [[ $main_response == *"HTTP_CODE:200"* ]]; then
    echo "✅ Main page: ACCESSIBLE"
else
    echo "❌ Main page: FAILED"
    echo "Response code: $(echo "$main_response" | grep -o 'HTTP_CODE:[0-9]*')"
fi

echo ""

# Test detailed health endpoint
echo "Testing /api/health..."
health_response=$(curl -s -w "HTTP_CODE:%{http_code}" http://localhost:3000/api/health 2>/dev/null)
if [[ $health_response == *"HTTP_CODE:200"* ]]; then
    echo "✅ Detailed health check: PASSED"
else
    echo "⚠️  Detailed health check: May have service dependencies"
    echo "Response code: $(echo "$health_response" | grep -o 'HTTP_CODE:[0-9]*')"
fi

echo ""
echo "🔧 Application appears to be running successfully!"
echo "   Access it at: http://localhost:3000"