#!/bin/bash
set -euo pipefail

echo "=== CCFrame Installation Test ==="
echo "Script is working properly!"
echo "Bash version: $BASH_VERSION"
echo "Current working directory: $(pwd)"
echo "User: $(whoami)"
echo

# Test basic functionality
echo "Testing basic commands..."
command -v curl >/dev/null && echo "✓ curl available" || echo "✗ curl not found"
command -v git >/dev/null && echo "✓ git available" || echo "✗ git not found"
command -v docker >/dev/null && echo "✓ docker available" || echo "✗ docker not found"
echo

echo "=== Test completed successfully ==="
echo "If you see this message, the script format is correct."
echo "You can now try the full installation script."