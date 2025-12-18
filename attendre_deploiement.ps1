# Script PowerShell pour attendre le déploiement Railway

Write-Host "🔄 ATTENTE DU DÉPLOIEMENT RAILWAY" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$maxAttempts = 10
$attempt = 0

while ($attempt -lt $maxAttempts) {
    $attempt++
    
    Write-Host "[$attempt/$maxAttempts] Vérification en cours..." -ForegroundColor Yellow
    Write-Host ""
    
    # Lancer le script de vérification
    node verifier_deploiement.js
    
    # Vérifier si le déploiement est terminé en analysant la sortie
    $output = node verifier_deploiement.js 2>&1 | Out-String
    
    if ($output -match "Device ID: 5298") {
        Write-Host "`n✅ DÉPLOIEMENT TERMINÉ !" -ForegroundColor Green
        Write-Host "Les variables sont maintenant actives.`n" -ForegroundColor Green
        
        Write-Host "🎯 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
        Write-Host "1. Créez une commande test sur https://afgestion.net"
        Write-Host "2. Mettez VOTRE numéro : +225..."
        Write-Host "3. Vérifiez que le SMS arrive de +2250595871746"
        Write-Host ""
        break
    }
    
    if ($attempt -lt $maxAttempts) {
        Write-Host "`n⏰ Prochaine vérification dans 30 secondes...`n" -ForegroundColor Cyan
        Write-Host "━" * 70 -ForegroundColor Gray
        Write-Host ""
        Start-Sleep -Seconds 30
    }
}

if ($attempt -eq $maxAttempts) {
    Write-Host "`n⚠️  DÉLAI DÉPASSÉ (5 minutes)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Les variables ne sont toujours pas actives." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 ACTIONS À FAIRE:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Allez sur Railway Dashboard:" -ForegroundColor White
    Write-Host "   https://railway.app/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "2. Vérifiez le status du déploiement:" -ForegroundColor White
    Write-Host "   Deployments → Dernier déploiement" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Si status = 'Active' depuis longtemps:" -ForegroundColor White
    Write-Host "   → Forcez un redéploiement (3 points → Redeploy)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Si status = 'Failed':" -ForegroundColor White
    Write-Host "   → Consultez les logs (View Logs)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Consultez le guide:" -ForegroundColor White
    Write-Host "   verifier_railway_status.md" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Appuyez sur une touche pour quitter..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
