@echo off
chcp 65001 >nul

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         📥 IMPORT ET CONFIGURATION DU PROJET                 ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Charger la configuration
if not exist "CONFIG.bat" (
    echo ❌ Erreur : Fichier CONFIG.bat non trouvé !
    echo    Vous devez être dans le dossier PACKAGE_DUPLICATION_EXPORT
    pause
    exit /b 1
)

call CONFIG.bat

echo 🔍 Vérification de la configuration...

if "%NEW_PROJECT_NAME%"=="" (
    echo ❌ Erreur : NEW_PROJECT_NAME non défini dans CONFIG.bat
    pause
    exit /b 1
)

echo ✅ Configuration validée
echo    Projet : %NEW_PROJECT_NAME%
echo.

REM Étape 1 : Configuration Git
echo 1️⃣  Configuration de Git...
git config user.name "%NEW_GITHUB_USERNAME%"
git config user.email "%NEW_GITHUB_EMAIL%"
echo    ✅ Git configuré

REM Étape 2 : Créer les fichiers .env
echo 2️⃣  Création des fichiers .env...

if exist "backend" (
    (
    echo DATABASE_URL=%NEW_DATABASE_URL%
    echo JWT_SECRET=%NEW_JWT_SECRET%
    echo PORT=%NEW_PORT%
    echo NODE_ENV=%NEW_NODE_ENV%
    ) > backend\.env
    echo    ✅ backend\.env créé
) else (
    (
    echo DATABASE_URL=%NEW_DATABASE_URL%
    echo JWT_SECRET=%NEW_JWT_SECRET%
    echo PORT=%NEW_PORT%
    echo NODE_ENV=%NEW_NODE_ENV%
    ) > .env
    echo    ✅ .env créé
)

if exist "frontend" (
    (
    echo VITE_API_URL=http://localhost:%NEW_PORT%
    ) > frontend\.env
    echo    ✅ frontend\.env créé
)

REM Étape 3 : Installer les dépendances
echo 3️⃣  Installation des dépendances...
echo    ⏳ Cela peut prendre 2-5 minutes...

if exist "package.json" (
    echo    📦 Installation backend...
    call npm install
) else if exist "backend\package.json" (
    echo    📦 Installation backend...
    cd backend
    call npm install
    cd ..
)

if exist "frontend\package.json" (
    echo    📦 Installation frontend...
    cd frontend
    call npm install
    cd ..
)

echo    ✅ Dépendances installées

REM Étape 4 : Prisma
echo 4️⃣  Configuration de Prisma...

if exist "prisma\schema.prisma" (
    call npx prisma generate
    if not "%NEW_DATABASE_URL%"=="" (
        echo    🔨 Application des migrations...
        call npx prisma migrate deploy 2>nul || call npx prisma migrate dev --name init
    )
    echo    ✅ Prisma configuré
) else if exist "backend\prisma\schema.prisma" (
    cd backend
    call npx prisma generate
    if not "%NEW_DATABASE_URL%"=="" (
        echo    🔨 Application des migrations...
        call npx prisma migrate deploy 2>nul || call npx prisma migrate dev --name init
    )
    cd ..
    echo    ✅ Prisma configuré
)

REM Étape 5 : Initialiser Git
echo 5️⃣  Initialisation de Git...
if exist ".git" rmdir /s /q ".git" 2>nul
git init
git add .
git commit -m "Initial commit - Project duplicated"
echo    ✅ Git initialisé

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║            ✅ IMPORT TERMINÉ AVEC SUCCÈS !                   ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📋 Prochaines étapes :
echo.
echo 1️⃣  Créer le dépôt sur GitHub :
echo    → https://github.com/new
echo    → Nom : %NEW_PROJECT_NAME%
echo    → Privé (recommandé)
echo.
echo    Puis exécuter :
echo    git remote add origin https://github.com/%NEW_GITHUB_USERNAME%/%NEW_PROJECT_NAME%.git
echo    git push -u origin main
echo.
echo 2️⃣  Déployer sur Railway : https://railway.app
echo 3️⃣  Déployer sur Vercel : https://vercel.com
echo.
echo 📖 Consultez README-QUICK.md pour le guide détaillé
echo.
echo 🎉 Bon développement !
echo.
pause









