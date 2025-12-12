# Script de démarrage de l'application GS Pipeline
Write-Host "🚀 Démarrage de GS Pipeline..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si Docker est en cours d'exécution
Write-Host "📦 Vérification de Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop." -ForegroundColor Red
    exit 1
}

# Démarrer PostgreSQL si nécessaire
Write-Host "🐘 Démarrage de PostgreSQL..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=gs-pipeline-db" --format "{{.Names}}"
if ($postgresRunning -ne "gs-pipeline-db") {
    docker-compose up -d
    Write-Host "⏳ Attente du démarrage de PostgreSQL..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}
Write-Host "✅ PostgreSQL est en cours d'exécution" -ForegroundColor Green
Write-Host ""

# Démarrer le Backend
Write-Host "🔧 Démarrage du Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🔧 Backend API - Port 5000' -ForegroundColor Cyan; npm run dev"

# Attendre que le backend démarre
Write-Host "⏳ Attente du démarrage du backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Démarrer le Frontend
Write-Host "🎨 Démarrage du Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🎨 Frontend - Port 5173' -ForegroundColor Cyan; npm run dev"

# Attendre que le frontend démarre
Write-Host "⏳ Attente du démarrage du frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "✅ Application démarrée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs de l'application :" -ForegroundColor Cyan
Write-Host "   Backend API : http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend    : http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Compte de test :" -ForegroundColor Cyan
Write-Host "   Email       : admin@gs-pipeline.com" -ForegroundColor White
Write-Host "   Mot de passe: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Ouverture du navigateur..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "💡 Appuyez sur Ctrl+C dans les fenêtres du backend et frontend pour arrêter l'application" -ForegroundColor Yellow
Write-Host ""


