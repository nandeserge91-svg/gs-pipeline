@echo off
REM ═══════════════════════════════════════════════════════════════
REM                  ⚙️  CONFIGURATION DU NOUVEAU PROJET
REM ═══════════════════════════════════════════════════════════════

REM ===== INFORMATIONS DU NOUVEAU PROJET =====
set "NEW_PROJECT_NAME=mon-nouveau-projet"

REM ===== GITHUB (Nouveau compte) =====
set "NEW_GITHUB_USERNAME=nouveau-username"
set "NEW_GITHUB_EMAIL=nouveau@email.com"

REM ===== BASE DE DONNÉES =====
set "NEW_DATABASE_URL="
REM Format : postgresql://postgres:PASSWORD@HOST.railway.app:5432/railway

REM ===== JWT & SÉCURITÉ =====
set "NEW_JWT_SECRET="
REM Générer avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

REM ===== GÉOLOCALISATION (Si applicable) =====
set "STORE_LATITUDE="
set "STORE_LONGITUDE="
set "STORE_NAME=Magasin Principal"
set "STORE_ADDRESS=Votre adresse"

REM ===== AUTRES VARIABLES =====
set "NEW_PORT=3000"
set "NEW_NODE_ENV=development"









