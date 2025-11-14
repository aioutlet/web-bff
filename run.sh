#!/bin/bash
# Run Web BFF with Dapr sidecar
# Usage: ./run.sh

echo "Starting Web BFF with Dapr..."
echo "Service will be available at: http://localhost:8080"
echo "Dapr HTTP endpoint: http://localhost:3580"
echo "Dapr gRPC endpoint: localhost:50080"
echo ""

dapr run \
  --app-id web-bff-service \
  --app-port 8080 \
  --dapr-http-port 3580 \
  --dapr-grpc-port 50080 \
  --resources-path .dapr/components \
  --config .dapr/config.yaml \
  --log-level warn \
  -- npx tsx watch src/server.ts
