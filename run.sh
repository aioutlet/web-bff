#!/bin/bash
# Run Web BFF service
# Usage: ./run.sh

echo "Starting Web BFF..."
echo "Service will be available at: http://localhost:8080"
echo "Press Ctrl+C to stop"
echo ""

# Set environment variables
export PORT=8080
export NODE_ENV=development

# Run the service
npx tsx watch src/server.ts
