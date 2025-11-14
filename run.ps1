#!/usr/bin/env pwsh
# Run Web BFF with Dapr sidecar
# Usage: .\run.ps1

Write-Host "Starting Web BFF with Dapr..." -ForegroundColor Green
Write-Host "Service will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "Dapr HTTP endpoint: http://localhost:3580" -ForegroundColor Cyan
Write-Host "Dapr gRPC endpoint: localhost:50080" -ForegroundColor Cyan
Write-Host ""

dapr run `
  --app-id web-bff-service `
  --app-port 8080 `
  --dapr-http-port 3580 `
  --dapr-grpc-port 50080 `
  --resources-path .dapr/components `
  --config .dapr/config.yaml `
  --log-level warn `
  -- npx tsx watch src/server.ts
