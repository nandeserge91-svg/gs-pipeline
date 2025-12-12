# Script de déploiement sur GitHub
Write-Host "`n🚀 DÉPLOIEMENT SUR GITHUB`n" -ForegroundColor Cyan

# Demander les informations
$repoName = Read-Host "Nom du repository GitHub (ex: gs-pipeline)"
$username = Read-Host "Votre username GitHub"
$private = Read-Host "Repository privé ? (O/n)"

Write-Host "`n1. Nettoyage..." -ForegroundColor Yellow
Remove-Item test-*.js, diagnostic*.js, seed-data.sql, prisma-client.js -Force -ErrorAction SilentlyContinue
Write-Host "✅ Fichiers de test supprimés" -ForegroundColor Green

Write-Host "`n2. Ajout des fichiers..." -ForegroundColor Yellow
git add .

Write-Host "`n3. Commit..." -ForegroundColor Yellow
$commitMsg = Read-Host "Message du commit (Enter pour default)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "Deploy: Application GS Pipeline"
}
git commit -m $commitMsg

Write-Host "`n4. Configuration du remote..." -ForegroundColor Yellow
$repoUrl = "https://github.com/$username/$repoName.git"
git remote remove origin 2>$null
git remote add origin $repoUrl
Write-Host "✅ Remote configuré : $repoUrl" -ForegroundColor Green

Write-Host "`n5. Push vers GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ CODE POUSSÉ SUR GITHUB ! ✅                     ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📍 Repository : https://github.com/$username/$repoName" -ForegroundColor Cyan
Write-Host "`n📋 PROCHAINES ÉTAPES :" -ForegroundColor Yellow
Write-Host "   1. Allez sur https://railway.app" -ForegroundColor White
Write-Host "   2. New Project → Deploy from GitHub" -ForegroundColor White
Write-Host "   3. Sélectionnez le repository $repoName" -ForegroundColor White
Write-Host "   4. Ajoutez PostgreSQL" -ForegroundColor White
Write-Host "   5. Configurez les variables d'environnement" -ForegroundColor White
Write-Host "`n📖 Voir GUIDE_DEPLOIEMENT.md pour les instructions détaillées`n" -ForegroundColor Cyan

