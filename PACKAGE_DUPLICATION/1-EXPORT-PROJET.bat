@echo off
chcp 65001 >nul
REM ###############################################################################
REM #                                                                             #
REM #           📦 SCRIPT 1 : EXPORT DU PROJET (ORDINATEUR SOURCE)                #
REM #                         VERSION WINDOWS                                     #
REM #                                                                             #
REM #  À exécuter sur l'ordinateur actuel pour préparer le projet                #
REM #                                                                             #
REM ###############################################################################

echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         📦 EXPORT DU PROJET POUR DUPLICATION                 ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Configuration
set "EXPORT_DIR=PACKAGE_DUPLICATION_EXPORT"

echo 📁 Projet détecté : %CD%
echo.

REM Étape 1 : Créer le dossier d'export
echo 1️⃣  Création du dossier d'export...
if not exist "%EXPORT_DIR%" mkdir "%EXPORT_DIR%"

REM Étape 2 : Sauvegarder les variables d'environnement
echo 2️⃣  Sauvegarde des variables d'environnement...

if exist ".env" (
    copy ".env" "%EXPORT_DIR%\backend.env.EXAMPLE" >nul 2>&1
    echo    ✅ .env copié
)

if exist "backend\.env" (
    copy "backend\.env" "%EXPORT_DIR%\backend.env.EXAMPLE" >nul 2>&1
    echo    ✅ backend\.env copié
)

if exist "frontend\.env" (
    copy "frontend\.env" "%EXPORT_DIR%\frontend.env.EXAMPLE" >nul 2>&1
    echo    ✅ frontend\.env copié
)

REM Étape 3 : Créer le fichier d'informations
echo 3️⃣  Extraction des informations du projet...

(
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          INFORMATIONS DU PROJET                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📦 Nom du projet : %CD%
echo 📅 Date d'export : %DATE% à %TIME%
echo 💻 Système : Windows
echo.
echo ══════════════════════════════════════════════════════════════
echo.
echo ⚙️  VERSIONS INSTALLÉES :
echo.
node --version 2>nul || echo Non installé
npm --version 2>nul || echo Non installé
git --version 2>nul || echo Non installé
echo.
echo ══════════════════════════════════════════════════════════════
) > "%EXPORT_DIR%\PROJECT_INFO.txt"

echo    ✅ Informations extraites

REM Étape 4 : Créer une copie propre du projet
echo 4️⃣  Création d'une copie propre du projet...

set "COPY_DIR=%EXPORT_DIR%\projet_clean"

echo    📁 Copie du projet en cours...
echo    ⏳ Cela peut prendre 1-2 minutes...

REM Créer le dossier de destination
if not exist "%COPY_DIR%" mkdir "%COPY_DIR%"

REM Copier tous les fichiers sauf les dossiers à exclure
xcopy /E /I /H /Y /EXCLUDE:%EXPORT_DIR%\exclude.txt . "%COPY_DIR%" >nul 2>&1

REM Créer le fichier d'exclusion temporaire
(
echo node_modules
echo dist
echo build
echo .git
echo .next
echo .turbo
echo .cache
echo %EXPORT_DIR%
) > "%EXPORT_DIR%\exclude.txt"

REM Copier avec robocopy (plus rapide et fiable)
robocopy . "%COPY_DIR%" /E /XD node_modules dist build .git .next .turbo .cache "%EXPORT_DIR%" /XF *.log /NFL /NDL /NJH /NJS /nc /ns /np 2>nul

REM Nettoyer la copie (pas l'original !)
if exist "%COPY_DIR%\node_modules" rmdir /s /q "%COPY_DIR%\node_modules" 2>nul
if exist "%COPY_DIR%\backend\node_modules" rmdir /s /q "%COPY_DIR%\backend\node_modules" 2>nul
if exist "%COPY_DIR%\frontend\node_modules" rmdir /s /q "%COPY_DIR%\frontend\node_modules" 2>nul
if exist "%COPY_DIR%\dist" rmdir /s /q "%COPY_DIR%\dist" 2>nul
if exist "%COPY_DIR%\frontend\build" rmdir /s /q "%COPY_DIR%\frontend\build" 2>nul

del "%EXPORT_DIR%\exclude.txt" 2>nul

echo    ✅ Copie créée
echo    ℹ️  Votre projet ORIGINAL reste INTACT !

REM Étape 5 : Créer le fichier de configuration
echo 5️⃣  Création du fichier de configuration...

(
echo @echo off
echo REM ═══════════════════════════════════════════════════════════════
echo REM                  ⚙️  CONFIGURATION DU NOUVEAU PROJET
echo REM ═══════════════════════════════════════════════════════════════
echo.
echo REM ===== INFORMATIONS DU NOUVEAU PROJET =====
echo set "NEW_PROJECT_NAME=mon-nouveau-projet"
echo.
echo REM ===== GITHUB (Nouveau compte^) =====
echo set "NEW_GITHUB_USERNAME=nouveau-username"
echo set "NEW_GITHUB_EMAIL=nouveau@email.com"
echo.
echo REM ===== BASE DE DONNÉES =====
echo set "NEW_DATABASE_URL="
echo REM Format : postgresql://postgres:PASSWORD@HOST.railway.app:5432/railway
echo.
echo REM ===== JWT ^& SÉCURITÉ =====
echo set "NEW_JWT_SECRET="
echo.
echo REM ===== GÉOLOCALISATION (Si applicable^) =====
echo set "STORE_LATITUDE="
echo set "STORE_LONGITUDE="
echo set "STORE_NAME=Magasin Principal"
echo set "STORE_ADDRESS=Votre adresse"
echo.
echo REM ===== AUTRES VARIABLES =====
echo set "NEW_PORT=3000"
echo set "NEW_NODE_ENV=development"
) > "%EXPORT_DIR%\CONFIG.bat"

echo    ✅ Fichier CONFIG.bat créé

REM Étape 6 : Créer le README
echo 6️⃣  Création des instructions...

(
echo # 📦 Package de Duplication de Projet
echo.
echo ## 🚀 Étapes rapides
echo.
echo ### Sur l'ORDINATEUR SOURCE ✅
echo 1. ✅ Vous avez déjà exécuté 1-EXPORT-PROJET.bat
echo 2. 📦 Transférez TOUT le projet sur le nouvel ordinateur
echo.
echo ### Sur le NOUVEL ORDINATEUR 🆕
echo.
echo #### 1. Installer les prérequis
echo - Node.js 18+ : https://nodejs.org
echo - Git : https://git-scm.com
echo.
echo #### 2. Créer les comptes
echo - GitHub : https://github.com/signup
echo - Railway : https://railway.app ^(créer PostgreSQL et copier DATABASE_URL^)
echo - Vercel : https://vercel.com/signup
echo.
echo #### 3. Configurer
echo 1. Ouvrir PACKAGE_DUPLICATION_EXPORT\CONFIG.bat
echo 2. Remplir TOUTES les variables
echo 3. Générer JWT_SECRET avec : node -e "console.log(require('crypto'^).randomBytes(64^).toString('hex'^)^)"
echo.
echo #### 4. Exécuter l'import
echo ```bash
echo cd PACKAGE_DUPLICATION_EXPORT
echo 2-IMPORT-PROJET.bat
echo ```
echo.
echo #### 5. Pousser sur GitHub
echo - Créer un nouveau dépôt sur github.com
echo - Exécuter :
echo ```bash
echo git remote add origin https://github.com/USERNAME/PROJET.git
echo git push -u origin main
echo ```
echo.
echo #### 6. Déployer
echo - Railway : New ^> GitHub Repo ^> Configurer
echo - Vercel : New Project ^> Import Git ^> Configurer VITE_API_URL
echo.
echo ## ✅ C'est tout !
echo.
echo Consultez le README.md complet dans le dossier pour plus de détails.
) > "%EXPORT_DIR%\README-QUICK.md"

echo    ✅ README créé

REM Étape 7 : Créer le script d'import Windows
echo 7️⃣  Création du script d'import...

(
echo @echo off
echo chcp 65001 ^>nul
echo.
echo echo ╔══════════════════════════════════════════════════════════════╗
echo echo ║                                                              ║
echo echo ║         📥 IMPORT ET CONFIGURATION DU PROJET                 ║
echo echo ║                                                              ║
echo echo ╚══════════════════════════════════════════════════════════════╝
echo echo.
echo.
echo REM Charger la configuration
echo if not exist "CONFIG.bat" (
echo     echo ❌ Erreur : Fichier CONFIG.bat non trouvé !
echo     pause
echo     exit /b 1
echo ^)
echo.
echo call CONFIG.bat
echo.
echo echo 🔍 Vérification de la configuration...
echo.
echo if "%%NEW_PROJECT_NAME%%"=="" (
echo     echo ❌ Erreur : NEW_PROJECT_NAME non défini dans CONFIG.bat
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo ✅ Configuration validée
echo echo    Projet : %%NEW_PROJECT_NAME%%
echo echo.
echo.
echo cd ..\..
echo.
echo REM Étape 1 : Configuration Git
echo echo 1️⃣  Configuration de Git...
echo git config user.name "%%NEW_GITHUB_USERNAME%%"
echo git config user.email "%%NEW_GITHUB_EMAIL%%"
echo echo    ✅ Git configuré
echo.
echo REM Étape 2 : Créer les fichiers .env
echo echo 2️⃣  Création des fichiers .env...
echo.
echo if exist "backend" (
echo     ^(
echo     echo DATABASE_URL=%%NEW_DATABASE_URL%%
echo     echo JWT_SECRET=%%NEW_JWT_SECRET%%
echo     echo PORT=%%NEW_PORT%%
echo     echo NODE_ENV=%%NEW_NODE_ENV%%
echo     ^) ^> backend\.env
echo     echo    ✅ backend\.env créé
echo ^)
echo.
echo if exist "frontend" (
echo     ^(
echo     echo VITE_API_URL=http://localhost:%%NEW_PORT%%
echo     ^) ^> frontend\.env
echo     echo    ✅ frontend\.env créé
echo ^)
echo.
echo REM Étape 3 : Installer les dépendances
echo echo 3️⃣  Installation des dépendances...
echo.
echo if exist "package.json" (
echo     echo    📦 Installation backend...
echo     call npm install
echo ^) else if exist "backend\package.json" (
echo     echo    📦 Installation backend...
echo     cd backend
echo     call npm install
echo     cd ..
echo ^)
echo.
echo if exist "frontend\package.json" (
echo     echo    📦 Installation frontend...
echo     cd frontend
echo     call npm install
echo     cd ..
echo ^)
echo.
echo echo    ✅ Dépendances installées
echo.
echo REM Étape 4 : Prisma
echo echo 4️⃣  Configuration de Prisma...
echo.
echo if exist "prisma\schema.prisma" (
echo     call npx prisma generate
echo     if not "%%NEW_DATABASE_URL%%"=="" (
echo         call npx prisma migrate deploy
echo     ^)
echo ^) else if exist "backend\prisma\schema.prisma" (
echo     cd backend
echo     call npx prisma generate
echo     if not "%%NEW_DATABASE_URL%%"=="" (
echo         call npx prisma migrate deploy
echo     ^)
echo     cd ..
echo ^)
echo.
echo REM Étape 5 : Initialiser Git
echo echo 5️⃣  Initialisation de Git...
echo if exist ".git" rmdir /s /q ".git"
echo git init
echo git add .
echo git commit -m "Initial commit - Project duplicated"
echo echo    ✅ Git initialisé
echo.
echo echo.
echo echo ╔══════════════════════════════════════════════════════════════╗
echo echo ║                                                              ║
echo echo ║            ✅ IMPORT TERMINÉ AVEC SUCCÈS !                   ║
echo echo ║                                                              ║
echo echo ╚══════════════════════════════════════════════════════════════╝
echo echo.
echo echo 📋 Prochaines étapes :
echo echo.
echo echo 1️⃣  Créer le dépôt sur GitHub :
echo echo    → https://github.com/new
echo echo    → Nom : %%NEW_PROJECT_NAME%%
echo echo.
echo echo    Puis exécuter :
echo echo    git remote add origin https://github.com/%%NEW_GITHUB_USERNAME%%/%%NEW_PROJECT_NAME%%.git
echo echo    git push -u origin main
echo echo.
echo echo 2️⃣  Déployer sur Railway : https://railway.app
echo echo 3️⃣  Déployer sur Vercel : https://vercel.com
echo echo.
echo echo 🎉 Bon développement !
echo echo.
echo pause
) > "%EXPORT_DIR%\2-IMPORT-PROJET.bat"

echo    ✅ Script d'import Windows créé

REM Résumé final
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║            ✅ EXPORT TERMINÉ AVEC SUCCÈS !                   ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📦 Package créé dans : %EXPORT_DIR%\
echo.
echo 📋 Contenu :
dir /b "%EXPORT_DIR%"
echo.
echo ✅ Votre projet ORIGINAL reste INTACT (rien n'a été supprimé !)
echo 📁 Une copie propre a été créée dans : %EXPORT_DIR%\projet_clean\
echo.
echo 📤 Prochaines étapes :
echo.
echo 1️⃣  Transférer le dossier %EXPORT_DIR% sur le nouvel ordinateur
echo    Méthodes : USB, Cloud (Drive/Dropbox), WeTransfer
echo.
echo 2️⃣  Sur le NOUVEL ordinateur :
echo    a^) Extraire le dossier %EXPORT_DIR%
echo    b^) Installer Node.js, npm, git
echo    c^) Créer les comptes GitHub, Railway, Vercel
echo    d^) Ouvrir %EXPORT_DIR%\CONFIG.bat
echo    e^) Remplir TOUTES les variables
echo    f^) Ouvrir le dossier projet_clean\
echo    g^) Exécuter : ..\2-IMPORT-PROJET.bat
echo.
echo 💡 ASTUCE : Compresser en ZIP pour faciliter le transfert :
echo    Clic-droit sur %EXPORT_DIR% ^> Envoyer vers ^> Dossier compressé
echo.
echo 📖 Consultez %EXPORT_DIR%\README-QUICK.md pour le guide
echo.
echo 🚀 Bonne duplication !
echo.
pause

