# 🔧 Fix : Erreur Module Service Account

## ❌ Problème

```
Error: Cannot find module '../../../projet-bus-60a3f-firebase-adminsdk-bqkqg-6e1f23e4eb.json'
```

## ✅ Solution Appliquée

Le script de seed a été modifié pour fonctionner **sans fichier service account** en mode émulateur.

---

## 🚀 Comment Utiliser Maintenant

### **Étape 1 : Démarrer les Émulateurs** (Terminal 1)

```bash
cd backend
npm run serve
```

**Attendez ce message :**
```
✔  All emulators ready! It is now safe to connect your app.
```

---

### **Étape 2 : Exécuter le Seed** (Terminal 2 - NOUVEAU)

```bash
cd backend
npm run seed
```

**Résultat attendu :**
```
✅ Firebase Admin initialisé en mode émulateur (sans credentials)

🚀 Début du seeding des données mock pour Abidjan...

👨‍✈️ Création des conducteurs...
✅ 8 conducteurs créés

👶 Création des élèves...
✅ 100 élèves créés

📋 Création des scans d'aujourd'hui...
✅ 90 scans créés (90% validation)

🛣️  Création des routes...
✅ 5 routes créées

🚌 Création des bus...
  ✓ Bus bus-1 - Cocody → Plateau - en_route - 25 élèves
  ✓ Bus bus-2 - Yopougon → Adjamé - en_route - 30 élèves
  ✓ Bus bus-3 - Abobo → Plateau - en_route - 18 élèves 🚨 RETARD 18 min
  ✓ Bus bus-4 - Treichville → Cocody - stopped - 15 élèves
  ✓ Bus bus-5 - Marcory → Plateau - en_route - 28 élèves 🚨 RETARD 23 min
  ✓ Bus bus-6 - Cocody → Plateau - idle - 12 élèves
  ✓ Bus bus-7 - HORS COURSE
  ✓ Bus bus-8 - HORS COURSE

✅ 8 bus créés avec positions GPS

🎉 Seeding terminé avec succès !

📊 Résumé des données créées :
  - 8 conducteurs
  - 5 routes
  - 8 bus
  - 100 élèves
  - 90 scans aujourd'hui (90% validation)
  - 6 bus en course
  - 2 bus hors course
  - 2 bus en retard critique
  - 1 bus en retard grave
```

---

## 🔍 Si Erreur "Émulateurs pas démarrés"

**Message d'erreur :**
```
❌ Erreur : Les émulateurs Firebase ne sont pas démarrés !
```

**Solution :**
1. Assurez-vous que le **Terminal 1** est actif avec `npm run serve`
2. Attendez que tous les émulateurs soient prêts
3. Relancez `npm run seed` dans le **Terminal 2**

---

## 📝 Ce qui a été modifié

**Fichier :** `backend/src/scripts/seed-mock-data.ts`

### **Avant (❌ Nécessitait service account)**
```typescript
const serviceAccount = require('../../../projet-bus-60a3f-firebase-adminsdk-bqkqg-6e1f23e4eb.json');

initializeApp({
  credential: cert(serviceAccount),
});
```

### **Après (✅ Fonctionne sans service account)**
```typescript
// Configuration pour les émulateurs
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Init sans credentials pour émulateurs
admin.initializeApp({
  projectId: 'projet-bus-60a3f',
});
```

### **Bonus : Vérification des émulateurs**
```typescript
async function checkEmulators() {
  try {
    await db.collection('_test').doc('_test').set({ test: true });
    await db.collection('_test').doc('_test').delete();
    return true;
  } catch (error) {
    console.error('❌ Erreur : Les émulateurs Firebase ne sont pas démarrés !');
    // ... instructions
    return false;
  }
}
```

---

## ✅ Checklist Complète

### **Setup Initial**
- [ ] `cd backend`
- [ ] `npm install` (si pas fait)
- [ ] `npm run build`

### **Exécution**
- [ ] **Terminal 1** : `npm run serve` (émulateurs)
- [ ] Attendre "All emulators ready"
- [ ] **Terminal 2** : `npm run seed` (données)
- [ ] Vérifier le succès du seed

### **Test Dashboard**
- [ ] **Terminal 3** : `cd web-admin && npm run dev`
- [ ] Ouvrir http://localhost:5173
- [ ] Vérifier les 3 KPIs
- [ ] Observer les retards critiques (2 bus)

---

## 💡 Note sur le Service Account

### **Développement Local (Émulateurs)**
✅ **Pas besoin** de fichier service account  
✅ Le script fonctionne directement avec les émulateurs

### **Production (Firebase réel)**
⚠️ **Besoin** du fichier service account  
📥 Télécharger depuis : Firebase Console → Settings → Service Accounts → Generate new private key

**Placement (optionnel) :**
```
backend/
  ├── service-account-key.json  ← Ici (optionnel)
  └── src/
```

Le script détectera automatiquement s'il existe et l'utilisera.

---

## 🎉 C'est Corrigé !

**Prochaines étapes :**
1. ✅ Terminal 1 : `npm run serve`
2. ✅ Terminal 2 : `npm run seed`
3. ✅ Terminal 3 : `cd web-admin && npm run dev`
4. ✅ Ouvrir http://localhost:5173

**Le Dashboard affichera maintenant toutes les données mockées !** 🚀

---

**Fichiers modifiés :**
- ✅ `backend/src/scripts/seed-mock-data.ts` (fix service account)
- ✅ Ajout vérification émulateurs
- ✅ Messages d'erreur clairs

