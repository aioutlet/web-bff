#!/usr/bin/env bash
# Run Web BFF with Dapr sidecar
# Usage: ./run.sh

echo -e "\033[0;32mStarting Web BFF with Dapr...\033[0m"
echo -e "\033[0;36mService will be available at: http://localhost:8080\033[0m"
echo -e "\033[0;36mDapr HTTP endpoint: http://localhost:3580\033[0m"
echo -e "\033[0;36mDapr gRPC endpoint: localhost:50013\033[0m"
echo ""

dapr run \
  --app-id web-bff-service \
  --app-port 8080 \
  --dapr-http-port 3580 \
  --dapr-grpc-port 50013 \
  --log-level warn \
  -- npx tsx watch src/server.ts
