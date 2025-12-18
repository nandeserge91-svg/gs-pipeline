# Script de Test SMS8.io pour GS-Pipeline
# Usage: .\test_sms_api.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     TEST SMS8.io - GS-PIPELINE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_URL = "https://gs-pipeline-production.up.railway.app"

# Demander le token admin
Write-Host "ETAPE 1: Obtenir votre token" -ForegroundColor Yellow
Write-Host ""
Write-Host "Comment obtenir votre token:" -ForegroundColor White
Write-Host "1. Ouvrez https://afgestion.net" -ForegroundColor Gray
Write-Host "2. Connectez-vous en tant qu'ADMIN" -ForegroundColor Gray
Write-Host "3. Appuyez sur F12 (Console)" -ForegroundColor Gray
Write-Host "4. Tapez: localStorage.getItem('token')" -ForegroundColor Gray
Write-Host "5. Copiez le token (sans les guillemets)" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Collez votre token admin"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "ERROR: Token vide !" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     TESTS EN COURS..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Configuration SMS
Write-Host "Test 1: Verification de la configuration SMS..." -ForegroundColor Yellow
try {
    $config = Invoke-RestMethod -Uri "$API_URL/api/sms/config" -Headers $headers -ErrorAction Stop
    if ($config.enabled) {
        Write-Host "[OK] SMS active" -ForegroundColor Green
        Write-Host "    Provider: $($config.provider)" -ForegroundColor Gray
        Write-Host "    Sender: $($config.senderName)" -ForegroundColor Gray
    } else {
        Write-Host "[WARNING] SMS desactive dans la config !" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERREUR] Impossible de recuperer la config" -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Credits SMS
Write-Host "Test 2: Verification des credits SMS..." -ForegroundColor Yellow
try {
    $credits = Invoke-RestMethod -Uri "$API_URL/api/sms/credits" -Headers $headers -ErrorAction Stop
    Write-Host "[OK] Credits disponibles: $($credits.credits)" -ForegroundColor Green
    Write-Host "    Taux: $($credits.rate) $($credits.currency)/SMS" -ForegroundColor Gray
    Write-Host "    Solde total: $($credits.credits * $credits.rate) $($credits.currency)" -ForegroundColor Gray
} catch {
    Write-Host "[ERREUR] Impossible de recuperer les credits" -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Templates
Write-Host "Test 3: Verification des templates SMS..." -ForegroundColor Yellow
try {
    $templates = Invoke-RestMethod -Uri "$API_URL/api/sms/templates" -Headers $headers -ErrorAction Stop
    Write-Host "[OK] $($templates.templates.Count) templates disponibles" -ForegroundColor Green
    foreach ($template in $templates.templates) {
        Write-Host "    - $($template.type)" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERREUR] Impossible de recuperer les templates" -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Historique
Write-Host "Test 4: Verification de l'historique SMS..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$API_URL/api/sms/history?limit=5" -Headers $headers -ErrorAction Stop
    Write-Host "[OK] Historique recupere: $($history.total) SMS total" -ForegroundColor Green
    if ($history.logs.Count -gt 0) {
        Write-Host "    Derniers SMS:" -ForegroundColor Gray
        foreach ($log in $history.logs) {
            $date = [DateTime]::Parse($log.sentAt).ToString("dd/MM/yyyy HH:mm")
            Write-Host "    - $date | $($log.type) | $($log.status) | $($log.phoneNumber)" -ForegroundColor Gray
        }
    } else {
        Write-Host "    Aucun SMS envoye pour le moment" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERREUR] Impossible de recuperer l'historique" -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: Statistiques
Write-Host "Test 5: Verification des statistiques..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$API_URL/api/sms/stats?days=7" -Headers $headers -ErrorAction Stop
    Write-Host "[OK] Statistiques (7 derniers jours)" -ForegroundColor Green
    Write-Host "    Total envoyes: $($stats.totalSent)" -ForegroundColor Gray
    Write-Host "    Reussis: $($stats.successful)" -ForegroundColor Gray
    Write-Host "    Echoues: $($stats.failed)" -ForegroundColor Gray
    Write-Host "    En attente: $($stats.pending)" -ForegroundColor Gray
    Write-Host "    Credits utilises: $($stats.creditsUsed)" -ForegroundColor Gray
} catch {
    Write-Host "[ERREUR] Impossible de recuperer les stats" -ForegroundColor Red
    Write-Host "    $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     TEST D'ENVOI SMS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sendTest = Read-Host "Voulez-vous envoyer un SMS de test ? (o/n)"

if ($sendTest -eq "o" -or $sendTest -eq "O" -or $sendTest -eq "oui") {
    Write-Host ""
    Write-Host "Format du numero: +2250712345678" -ForegroundColor Gray
    $phone = Read-Host "Entrez votre numero de telephone"
    
    if ([string]::IsNullOrWhiteSpace($phone)) {
        Write-Host "[ERREUR] Numero vide !" -ForegroundColor Red
        exit 1
    }
    
    $message = Read-Host "Message (laissez vide pour message par defaut)"
    
    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "Test SMS GS-Pipeline - Systeme operationnel ! Integration SMS8.io reussie."
    }
    
    Write-Host ""
    Write-Host "Envoi du SMS en cours..." -ForegroundColor Yellow
    
    $body = @{
        phoneNumber = $phone
        message = $message
    } | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod -Uri "$API_URL/api/sms/test" -Method POST -Headers $headers -Body $body -ErrorAction Stop
        Write-Host ""
        Write-Host "[SUCCESS] SMS envoye avec succes !" -ForegroundColor Green
        Write-Host "    ID SMS: $($result.smsId)" -ForegroundColor Gray
        Write-Host "    Telephone: $($result.phoneNumber)" -ForegroundColor Gray
        Write-Host "    Credits utilises: $($result.creditsUsed)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Verifiez votre telephone ! 📱" -ForegroundColor Cyan
    } catch {
        Write-Host ""
        Write-Host "[ERREUR] Echec de l'envoi du SMS" -ForegroundColor Red
        Write-Host "    $_" -ForegroundColor Red
        
        # Essayer de parser l'erreur JSON
        try {
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorDetails.error) {
                Write-Host "    Details: $($errorDetails.error)" -ForegroundColor Red
            }
        } catch {}
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     TESTS TERMINES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour plus de tests, consultez: GUIDE_TEST_SMS.md" -ForegroundColor Gray
Write-Host ""
