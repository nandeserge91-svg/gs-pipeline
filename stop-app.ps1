# Script d'arrêt de l'application GS Pipeline
Write-Host "🛑 Arrêt de GS Pipeline..." -ForegroundColor Cyan
Write-Host ""

# Arrêter les processus Node.js (Backend et Frontend)
Write-Host "🔧 Arrêt des serveurs Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Serveurs Node.js arrêtés" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun serveur Node.js en cours d'exécution" -ForegroundColor Gray
}

# Arrêter Docker Compose (optionnel - décommentez si vous voulez arrêter PostgreSQL)
# Write-Host "🐘 Arrêt de PostgreSQL..." -ForegroundColor Yellow
# docker-compose down
# Write-Host "✅ PostgreSQL arrêté" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Application arrêtée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "💡 PostgreSQL continue de fonctionner en arrière-plan." -ForegroundColor Yellow
Write-Host "   Pour l'arrêter complètement, exécutez : docker-compose down" -ForegroundColor Yellow
Write-Host ""


