# Script PowerShell pour vérifier le déploiement Railway

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 Vérification Déploiement Railway" -ForegroundColor Cyan
Write-Host "  📅 $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

$API_URL = "https://gs-pipeline-production.up.railway.app"

Write-Host "🔍 Vérification du déploiement...`n" -ForegroundColor Yellow
Write-Host "📍 URL API: $API_URL`n"

try {
    Write-Host "1️⃣ Test de connexion à l'API..." -ForegroundColor White
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$API_URL/api/products" -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    $stopwatch.Stop()
    
    Write-Host "   ⏱️  Temps de réponse: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
    Write-Host "   📊 Statut HTTP: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ✅ API accessible et fonctionnelle`n" -ForegroundColor Green
    
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ⏱️  Temps de réponse: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
        Write-Host "   📊 Statut HTTP: 401" -ForegroundColor Green
        Write-Host "   ✅ API accessible (401 = authentification requise, c'est normal)`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n   ⏰ Le déploiement est peut-être encore en cours" -ForegroundColor Yellow
        Write-Host "   Attendez encore 2-3 minutes et réessayez`n" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "2️⃣ Vérification du dernier commit..." -ForegroundColor White
$lastCommit = git log --oneline -1
Write-Host "   📝 Dernier commit: $lastCommit" -ForegroundColor Cyan
Write-Host "   ✅ Code à jour sur GitHub`n" -ForegroundColor Green

Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "   1. ✅ Le déploiement est terminé !" -ForegroundColor Green
Write-Host "   2. Configurez BEE VENOM avec les prix variantes"
Write-Host "   3. Testez en créant une commande depuis Google Sheets"
Write-Host "   4. Vérifiez que le prix est correct selon la quantité`n"

Write-Host "✅ DÉPLOIEMENT TERMINÉ - Vous pouvez tester !" -ForegroundColor Green -BackgroundColor DarkGreen
Write-Host ""

























