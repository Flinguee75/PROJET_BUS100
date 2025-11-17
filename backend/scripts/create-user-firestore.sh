#!/bin/bash
# Script pour créer le document utilisateur dans Firestore via Firebase CLI

echo "📝 Création du document utilisateur dans Firestore..."
echo ""

# Informations utilisateur
UID="WZXQ0GXK8PShj9ux8wTXamZx2tY2"
EMAIL="redfoo932@gmail.com"

# Créer le document via Firebase CLI
firebase firestore:set "users/$UID" \
  --project projet-bus-60a3f \
  --data '{
    "email": "'"$EMAIL"'",
    "displayName": "Admin",
    "role": "admin",
    "phoneNumber": "",
    "isActive": true
  }'

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Document Firestore créé avec succès!"
  echo "📧 Email: $EMAIL"
  echo "🆔 UID: $UID"
  echo "👤 Rôle: admin"
  echo ""
  echo "🎉 Vous pouvez maintenant vous connecter au dashboard!"
else
  echo ""
  echo "❌ Erreur lors de la création du document"
  echo "Utilisez plutôt la Console Firebase : https://console.firebase.google.com/project/projet-bus-60a3f/firestore"
fi

