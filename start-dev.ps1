# ─────────────────────────────────────────────────────────────
#  EventSphere — Windows development launcher (PowerShell)
# ─────────────────────────────────────────────────────────────
$ErrorActionPreference = "Stop"

Write-Host "▸ Checking Node.js…" -ForegroundColor Cyan
node -v

Write-Host "▸ Checking MongoDB…" -ForegroundColor Cyan
try {
  mongosh --quiet --eval "db.runCommand({ping:1})" *> $null
  Write-Host "  ✓ MongoDB is already running" -ForegroundColor Green
} catch {
  Write-Host "  Starting MongoDB service…" -ForegroundColor Cyan
  Start-Process powershell -Verb RunAs -ArgumentList "-Command net start MongoDB" -Wait
}

Write-Host "▸ Installing server dependencies…" -ForegroundColor Cyan
Push-Location server; npm install; Pop-Location

if (-not (Test-Path "server/.env")) {
  Write-Host "▸ Creating server/.env…" -ForegroundColor Cyan
  Copy-Item "server/.env.example" "server/.env"
}

Write-Host "▸ Seeding the database…" -ForegroundColor Cyan
Push-Location server; npm run seed; Pop-Location

Write-Host "▸ Starting the API on http://localhost:5000 …" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command cd server; npm run dev"

Write-Host "▸ Installing frontend dependencies…" -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor White
Write-Host "  Admin login: admin@eventsphere.io / ChangeMe!2026"
Write-Host "  Frontend   : http://localhost:5173"
Write-Host "  API        : http://localhost:5000/api/v1"
Write-Host "═══════════════════════════════════════════════" -ForegroundColor White
Write-Host ""
Write-Host "▸ Starting the frontend…" -ForegroundColor Cyan
npm run dev
