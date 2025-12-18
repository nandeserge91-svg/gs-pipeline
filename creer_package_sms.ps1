# Script PowerShell pour créer le package SMS complet
# À exécuter depuis la racine du projet

Write-Host "📦 Création du package SMS pour votre autre projet..." -ForegroundColor Cyan
Write-Host ""

# Créer le dossier principal
$packageDir = "SMS_INTEGRATION_PACKAGE"
if (Test-Path $packageDir) {
    Write-Host "⚠️  Le dossier $packageDir existe déjà. Suppression..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $packageDir
}

Write-Host "📁 Création de la structure..." -ForegroundColor Green
New-Item -ItemType Directory -Path "$packageDir" | Out-Null
New-Item -ItemType Directory -Path "$packageDir\backend\services" | Out-Null
New-Item -ItemType Directory -Path "$packageDir\backend\routes" | Out-Null
New-Item -ItemType Directory -Path "$packageDir\backend\utils" | Out-Null
New-Item -ItemType Directory -Path "$packageDir\frontend\src\pages\admin" | Out-Null
New-Item -ItemType Directory -Path "$packageDir\database" | Out-Null
New-Item -ItemType Directory -Path "$packageDir\documentation" | Out-Null

Write-Host "✅ Structure créée" -ForegroundColor Green
Write-Host ""

# Copier les fichiers backend
Write-Host "📄 Copie des fichiers backend..." -ForegroundColor Cyan

Copy-Item "services\sms.service.js" "$packageDir\backend\services\" -ErrorAction SilentlyContinue
Copy-Item "routes\sms.routes.js" "$packageDir\backend\routes\" -ErrorAction SilentlyContinue
Copy-Item "routes\sms-settings.routes.js" "$packageDir\backend\routes\" -ErrorAction SilentlyContinue
Copy-Item "routes\sms-templates.routes.js" "$packageDir\backend\routes\" -ErrorAction SilentlyContinue
Copy-Item "utils\phone.util.js" "$packageDir\backend\utils\" -ErrorAction SilentlyContinue

Write-Host "✅ Backend : 5 fichiers copiés" -ForegroundColor Green

# Copier les fichiers frontend
Write-Host "📄 Copie des fichiers frontend..." -ForegroundColor Cyan

Copy-Item "frontend\src\pages\admin\SmsSettings.tsx" "$packageDir\frontend\src\pages\admin\" -ErrorAction SilentlyContinue
Copy-Item "frontend\src\pages\admin\SmsTemplateEditor.tsx" "$packageDir\frontend\src\pages\admin\" -ErrorAction SilentlyContinue

Write-Host "✅ Frontend : 2 fichiers copiés" -ForegroundColor Green

# Copier la documentation
Write-Host "📄 Copie de la documentation..." -ForegroundColor Cyan

Copy-Item "POUR_AUTRE_PROJET_CURSOR.md" "$packageDir\documentation\" -ErrorAction SilentlyContinue
Copy-Item "INTEGRATION_SMS8_COMPLETE_GUIDE.md" "$packageDir\documentation\" -ErrorAction SilentlyContinue
Copy-Item "CONFIG_RAILWAY_ANDROID.md" "$packageDir\documentation\" -ErrorAction SilentlyContinue
Copy-Item "COMMENT_PARTAGER_FICHIERS.md" "$packageDir\documentation\" -ErrorAction SilentlyContinue

Write-Host "✅ Documentation : 4 fichiers copiés" -ForegroundColor Green

# Créer un README pour le package
Write-Host "📄 Création du README du package..." -ForegroundColor Cyan

$readmeContent = @"
# 📦 PACKAGE INTÉGRATION SMS8.IO

Ce package contient tous les fichiers nécessaires pour intégrer SMS8.io dans votre projet.

## 📂 CONTENU

### Backend (5 fichiers)
- ``backend/services/sms.service.js`` - Service principal SMS
- ``backend/routes/sms.routes.js`` - Routes API SMS
- ``backend/routes/sms-settings.routes.js`` - Routes paramètres SMS
- ``backend/routes/sms-templates.routes.js`` - Routes templates SMS
- ``backend/utils/phone.util.js`` - Utilitaire nettoyage téléphone

### Frontend (2 fichiers)
- ``frontend/src/pages/admin/SmsSettings.tsx`` - Panneau admin SMS
- ``frontend/src/pages/admin/SmsTemplateEditor.tsx`` - Éditeur de templates

### Documentation (4 fichiers)
- ``documentation/POUR_AUTRE_PROJET_CURSOR.md`` - **📘 GUIDE PRINCIPAL À LIRE EN PREMIER**
- ``documentation/INTEGRATION_SMS8_COMPLETE_GUIDE.md`` - Guide détaillé avec migration SQL
- ``documentation/CONFIG_RAILWAY_ANDROID.md`` - Configuration Railway
- ``documentation/COMMENT_PARTAGER_FICHIERS.md`` - Guide de partage

## 🚀 DÉMARRAGE RAPIDE

1. **Lisez d'abord** : ``documentation/POUR_AUTRE_PROJET_CURSOR.md``
2. **Copiez les fichiers** dans votre projet selon la structure indiquée
3. **Suivez le guide** étape par étape
4. **Configurez vos variables** SMS8.io (API Key, Device ID, etc.)
5. **Déployez et testez**

## ⏰ TEMPS ESTIMÉ

~60 minutes pour l'intégration complète

## ⚠️ IMPORTANT

- Utilisez VOTRE propre API Key SMS8.io
- Utilisez VOTRE propre Device ID Android
- Adaptez le préfixe téléphone selon votre pays

## 📞 SUPPORT

Consultez les guides dans le dossier ``documentation/``

---

**Bonne intégration ! 🚀**
"@

Set-Content -Path "$packageDir\README.md" -Value $readmeContent -Encoding UTF8

Write-Host "✅ README créé" -ForegroundColor Green
Write-Host ""

# Créer un fichier de structure
$structureContent = @"
SMS_INTEGRATION_PACKAGE/
│
├── README.md (À LIRE EN PREMIER)
│
├── backend/
│   ├── services/
│   │   └── sms.service.js (545 lignes)
│   ├── routes/
│   │   ├── sms.routes.js (364 lignes)
│   │   ├── sms-settings.routes.js (349 lignes)
│   │   └── sms-templates.routes.js (274 lignes)
│   └── utils/
│       └── phone.util.js (76 lignes)
│
├── frontend/
│   └── src/
│       └── pages/
│           └── admin/
│               ├── SmsSettings.tsx (462 lignes)
│               └── SmsTemplateEditor.tsx (379 lignes)
│
└── documentation/
    ├── POUR_AUTRE_PROJET_CURSOR.md (📘 GUIDE PRINCIPAL)
    ├── INTEGRATION_SMS8_COMPLETE_GUIDE.md
    ├── CONFIG_RAILWAY_ANDROID.md
    └── COMMENT_PARTAGER_FICHIERS.md

TOTAL : 11 fichiers + 4 guides
"@

Set-Content -Path "$packageDir\STRUCTURE.txt" -Value $structureContent -Encoding UTF8

Write-Host "✅ Fichier de structure créé" -ForegroundColor Green
Write-Host ""

# Résumé
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "🎉 PACKAGE CRÉÉ AVEC SUCCÈS !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "📁 Emplacement : .\$packageDir\" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Contenu :" -ForegroundColor White
Write-Host "   ✅ 5 fichiers backend" -ForegroundColor Green
Write-Host "   ✅ 2 fichiers frontend" -ForegroundColor Green
Write-Host "   ✅ 4 guides de documentation" -ForegroundColor Green
Write-Host "   ✅ README.md" -ForegroundColor Green
Write-Host "   ✅ STRUCTURE.txt" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "   1. Compressez le dossier $packageDir en ZIP" -ForegroundColor White
Write-Host "   2. Envoyez le ZIP à votre autre éditeur" -ForegroundColor White
Write-Host "   3. Demandez-lui de lire README.md en premier" -ForegroundColor White
Write-Host ""
Write-Host "💡 Ou envoyez directement le lien GitHub :" -ForegroundColor Cyan
Write-Host "   https://github.com/nandeserge91-svg/gs-pipeline" -ForegroundColor Blue
Write-Host ""
Write-Host "🎊 C'est prêt ! Bonne intégration ! 🚀" -ForegroundColor Green
