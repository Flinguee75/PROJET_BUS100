#!/bin/bash

# Script de vérification du setup
# Usage: bash verify-setup.sh

echo "🔍 Vérification du Setup Transport Scolaire"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASS=0
FAIL=0

# Fonction de test
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAIL++))
    fi
}

echo "📋 Vérification Structure de Fichiers"
echo "-----------------------------------"

[ -d "backend" ] && check 0 "Dossier backend/" || check 1 "Dossier backend/"
[ -d "web-admin" ] && check 0 "Dossier web-admin/" || check 1 "Dossier web-admin/"
[ -d "mobile-parent" ] && check 0 "Dossier mobile-parent/" || check 1 "Dossier mobile-parent/"
[ -d "mobile-driver" ] && check 0 "Dossier mobile-driver/" || check 1 "Dossier mobile-driver/"
[ -d "docs" ] && check 0 "Dossier docs/" || check 1 "Dossier docs/"
[ -d ".github/workflows" ] && check 0 "Dossier .github/workflows/" || check 1 "Dossier .github/workflows/"

echo ""
echo "📝 Vérification Fichiers Configuration"
echo "------------------------------------"

[ -f "firebase.json" ] && check 0 "firebase.json" || check 1 "firebase.json"
[ -f ".firebaserc" ] && check 0 ".firebaserc" || check 1 ".firebaserc"
[ -f "firestore.rules" ] && check 0 "firestore.rules" || check 1 "firestore.rules"
[ -f "firestore.indexes.json" ] && check 0 "firestore.indexes.json" || check 1 "firestore.indexes.json"
[ -f "README.md" ] && check 0 "README.md" || check 1 "README.md"
[ -f "CLAUDE.md" ] && check 0 "CLAUDE.md" || check 1 "CLAUDE.md"

echo ""
echo "🔧 Vérification Backend"
echo "---------------------"

[ -f "backend/package.json" ] && check 0 "backend/package.json" || check 1 "backend/package.json"
[ -f "backend/tsconfig.json" ] && check 0 "backend/tsconfig.json" || check 1 "backend/tsconfig.json"
[ -f "backend/jest.config.js" ] && check 0 "backend/jest.config.js" || check 1 "backend/jest.config.js"
[ -d "backend/src" ] && check 0 "backend/src/" || check 1 "backend/src/"
[ -d "backend/tests" ] && check 0 "backend/tests/" || check 1 "backend/tests/"
[ -d "backend/node_modules" ] && check 0 "backend/node_modules/ (dépendances installées)" || check 1 "backend/node_modules/ (npm install requis)"

echo ""
echo "📱 Vérification Web Admin"
echo "-----------------------"

[ -f "web-admin/package.json" ] && check 0 "web-admin/package.json" || check 1 "web-admin/package.json"
[ -f "web-admin/vite.config.ts" ] && check 0 "web-admin/vite.config.ts" || check 1 "web-admin/vite.config.ts"

echo ""
echo "🔄 Vérification CI/CD"
echo "-------------------"

[ -f ".github/workflows/backend.yml" ] && check 0 "Workflow backend.yml" || check 1 "Workflow backend.yml"
[ -f ".github/workflows/web-admin.yml" ] && check 0 "Workflow web-admin.yml" || check 1 "Workflow web-admin.yml"
[ -f ".github/workflows/mobile-parent.yml" ] && check 0 "Workflow mobile-parent.yml" || check 1 "Workflow mobile-parent.yml"
[ -f ".github/workflows/mobile-driver.yml" ] && check 0 "Workflow mobile-driver.yml" || check 1 "Workflow mobile-driver.yml"

echo ""
echo "🧪 Vérification Code Backend"
echo "--------------------------"

[ -f "backend/src/index.ts" ] && check 0 "Point d'entrée index.ts" || check 1 "Point d'entrée index.ts"
[ -d "backend/src/types" ] && check 0 "Types TypeScript" || check 1 "Types TypeScript"
[ -d "backend/src/services" ] && check 0 "Services (logique métier)" || check 1 "Services (logique métier)"
[ -d "backend/src/controllers" ] && check 0 "Controllers" || check 1 "Controllers"
[ -d "backend/src/routes" ] && check 0 "Routes API" || check 1 "Routes API"
[ -f "backend/src/utils/validation.schemas.ts" ] && check 0 "Schémas Zod" || check 1 "Schémas Zod"

echo ""
echo "=========================================="
echo -e "Résultats: ${GREEN}${PASS} passés${NC} | ${RED}${FAIL} échoués${NC}"
echo "=========================================="

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ Setup complet validé !${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. cd backend && npm run build"
    echo "  2. cd backend && npm test"
    echo "  3. cd backend && npm run serve"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Certains fichiers manquent${NC}"
    echo "Vérifiez SETUP_COMPLETE.md pour la liste complète"
    echo ""
    exit 1
fi
