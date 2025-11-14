#!/usr/bin/env pwsh
# Run Web BFF with Dapr sidecar
# Usage: .\run.ps1

Write-Host "Starting Web BFF with Dapr..." -ForegroundColor Green
Write-Host "Service will be available at: http://localhost:3100" -ForegroundColor Cyan
Write-Host "Dapr HTTP endpoint: http://localhost:3600" -ForegroundColor Cyan
Write-Host "Dapr gRPC endpoint: localhost:50060" -ForegroundColor Cyan
Write-Host ""

dapr run `
  --app-id web-bff `
  --app-port 3100 `
  --dapr-http-port 3600 `
  --dapr-grpc-port 50060 `
  --resources-path .dapr/components `
  --config .dapr/config.yaml `
  --log-level warn `
  -- npx tsx watch src/server.ts
