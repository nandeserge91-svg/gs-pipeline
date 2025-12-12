Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          🔍 VÉRIFICATION AUTOMATIQUE DES DÉPLOIEMENTS         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Vérification Railway
Write-Host "🚂 RAILWAY (Backend)..." -ForegroundColor Yellow
try {
    $railwayResponse = Invoke-WebRequest -Uri "https://gs-pipeline-production.up.railway.app" -TimeoutSec 10 -UseBasicParsing
    Write-Host "   ✅ ACTIF ! Backend répond correctement" -ForegroundColor Green
    Write-Host "   Réponse : $($railwayResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "   ⏳ Pas encore prêt (Build en cours...)" -ForegroundColor Yellow
}

Write-Host ""

# Test API Railway
Write-Host "🔑 Test API Authentication..." -ForegroundColor Yellow
try {
    $body = @{ email = "admin@gs-pipeline.com"; password = "admin123" } | ConvertTo-Json
    $loginResponse = Invoke-WebRequest -Uri "https://gs-pipeline-production.up.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing
    Write-Host "   ✅ API FONCTIONNELLE ! Authentication OK" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "   ⚠️  Backend actif mais migrations pas encore appliquées" -ForegroundColor Yellow
    } else {
        Write-Host "   ⏳ API pas encore disponible" -ForegroundColor Yellow
    }
}

Write-Host "`n═══════════════════════════════════════════════════════════════════`n" -ForegroundColor Gray

Write-Host "💡 INSTRUCTIONS :`n" -ForegroundColor Cyan
Write-Host "   • Si Railway est ACTIF → Appliquez les migrations (voir MIGRATIONS_RAILWAY.md)" -ForegroundColor White
Write-Host "   • Si Vercel est OK → Donnez l'URL Vercel" -ForegroundColor White
Write-Host "   • Vous pouvez relancer ce script avec : .\check-deployments.ps1`n" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════════`n" -ForegroundColor Gray

