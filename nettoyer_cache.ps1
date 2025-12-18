Write-Host "Nettoyage du cache..." -ForegroundColor Yellow

# Nettoyer le cache Vite
$vitePath = "frontend/node_modules/.vite"
if (Test-Path $vitePath) {
    Remove-Item -Path $vitePath -Recurse -Force
    Write-Host "Cache Vite supprime" -ForegroundColor Green
}

# Nettoyer le dossier dist
$distPath = "frontend/dist"
if (Test-Path $distPath) {
    Remove-Item -Path $distPath -Recurse -Force
    Write-Host "Dossier dist supprime" -ForegroundColor Green
}

Write-Host ""
Write-Host "Nettoyage termine!" -ForegroundColor Green
Write-Host ""
Write-Host "MAINTENANT :" -ForegroundColor Yellow
Write-Host "1. Terminal 1: npm run dev" -ForegroundColor Cyan
Write-Host "2. Terminal 2: cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host "3. Navigateur: Ctrl+Shift+R" -ForegroundColor Cyan






