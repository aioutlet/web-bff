#!/bin/bash
# Run Web BFF with Dapr sidecar
# Usage: ./run.sh

echo "Starting Web BFF with Dapr..."
echo "Service will be available at: http://localhost:3100"
echo "Dapr HTTP endpoint: http://localhost:3600"
echo "Dapr gRPC endpoint: localhost:50060"
echo ""

dapr run \
  --app-id web-bff \
  --app-port 3100 \
  --dapr-http-port 3600 \
  --dapr-grpc-port 50060 \
  --resources-path .dapr/components \
  --config .dapr/config.yaml \
  --log-level warn \
  -- npx tsx watch src/server.ts
