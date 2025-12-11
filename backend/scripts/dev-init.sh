#!/bin/bash

# Script pour initialiser l'environnement de développement
# Lance les émulateurs, seed la base de données et crée un utilisateur

echo "🚀 Initialisation de l'environnement de développement..."

# Couleurs pour les logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build du projet
echo -e "${BLUE}📦 Build du projet...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi

# Lancer les émulateurs en arrière-plan
echo -e "${BLUE}🔧 Lancement des émulateurs Firebase...${NC}"
firebase emulators:start --only functions,firestore,auth --project projet-bus-60a3f &
EMULATOR_PID=$!

# Fonction pour arrêter les émulateurs à la sortie
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt des émulateurs...${NC}"
    kill $EMULATOR_PID 2>/dev/null
    exit
}

# Capturer CTRL+C pour cleanup
trap cleanup SIGINT SIGTERM

# Attendre que les émulateurs soient prêts (vérifier le port Firestore)
echo -e "${BLUE}⏳ Attente du démarrage des émulateurs...${NC}"
MAX_WAIT=60
COUNTER=0
while ! nc -z localhost 8080 2>/dev/null; do
    sleep 1
    COUNTER=$((COUNTER + 1))
    if [ $COUNTER -ge $MAX_WAIT ]; then
        echo "❌ Timeout: les émulateurs n'ont pas démarré"
        cleanup
    fi
    echo -n "."
done

echo -e "\n${GREEN}✅ Émulateurs démarrés${NC}"

# Attendre encore 3 secondes pour s'assurer que tout est prêt
sleep 3

# Lancer le seed
echo -e "${BLUE}🌱 Seed de la base de données...${NC}"
npm run seed
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du seed"
    cleanup
fi
echo -e "${GREEN}✅ Seed terminé${NC}"

# Créer l'utilisateur
echo -e "${BLUE}👤 Création de l'utilisateur...${NC}"
npm run create-user-emulator
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la création de l'utilisateur"
    cleanup
fi
echo -e "${GREEN}✅ Utilisateur créé${NC}"

# Afficher le message de succès
echo -e "\n${GREEN}🎉 Environnement prêt !${NC}"
echo -e "${BLUE}Les émulateurs continuent de tourner...${NC}"
echo -e "${YELLOW}Appuyez sur CTRL+C pour arrêter${NC}\n"

# Garder le script actif et afficher les logs
wait $EMULATOR_PID
