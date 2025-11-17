# 🍎 Configuration Firebase pour iOS

## 📥 1. Télécharger GoogleService-Info.plist

1. Va sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionne ton projet : `projet-bus-60a3f`
3. Clique sur l'icône ⚙️ → **Paramètres du projet**
4. Descends jusqu'à **"Vos applications"**
5. Si l'app iOS n'existe pas encore :
   - Clique sur **"Ajouter une application"** → iOS (icône Apple)
   - **Bundle ID** : `com.projet.bus` (doit être identique à Android!)
   - **Nom de l'app** : `Parent App`
   - Télécharge `GoogleService-Info.plist`
6. Si l'app existe déjà :
   - Clique sur l'icône iOS dans la liste
   - Télécharge `GoogleService-Info.plist`

---

## 📂 2. Placer le fichier

**⚠️ IMPORTANT : Ne PAS mettre dans le dossier racine iOS !**

Le fichier doit être ajouté **via Xcode** :

```bash
mobile-parent/parent_app/ios/Runner/GoogleService-Info.plist
```

---

## 🔧 3. Ajouter le fichier via Xcode

### Option A : Via Xcode (RECOMMANDÉ)

```bash
# 1. Ouvrir le projet iOS dans Xcode
cd mobile-parent/parent_app
open ios/Runner.xcworkspace
```

Dans Xcode :
1. Clique droit sur le dossier **Runner** (pas le dossier Runner avec l'icône bleue)
2. Sélectionne **"Add Files to "Runner""**
3. Sélectionne le fichier `GoogleService-Info.plist` téléchargé
4. **IMPORTANT :** Coche **"Copy items if needed"**
5. **IMPORTANT :** Coche **"Add to targets: Runner"**
6. Clique sur **"Add"**

### Option B : Copie manuelle (puis import Xcode)

```bash
# Copier le fichier téléchargé
cp ~/Downloads/GoogleService-Info.plist mobile-parent/parent_app/ios/Runner/

# PUIS ouvrir Xcode et vérifier qu'il apparaît dans le projet
open ios/Runner.xcworkspace
```

---

## 🔐 4. Configurer le Podfile

Le Podfile est déjà configuré automatiquement par Flutter, mais vérifie :

**Fichier : `ios/Podfile`**

Assure-toi que ces lignes existent (elles devraient déjà être là) :

```ruby
# Décommente cette ligne pour définir une version minimale iOS
platform :ios, '13.0'

# Firebase nécessite des frameworks dynamiques
use_frameworks!
```

---

## 📦 5. Installer les pods

```bash
cd ios
pod install
cd ..
```

Si tu as des erreurs, essaye :

```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

---

## ✅ 6. Vérifier la configuration

Vérifie que `GoogleService-Info.plist` contient le bon **Bundle ID** :

```xml
<key>BUNDLE_ID</key>
<string>com.projet.bus</string>
```

---

## 🚀 7. Tester sur iOS

```bash
# Lancer l'app sur simulateur iOS
flutter run -d iphone

# Ou sur un appareil iOS connecté
flutter run -d <device-id>
```

---

## 🔥 Résultat attendu

Une fois configuré, ton app iOS pourra :
- ✅ Authentifier les utilisateurs (Firebase Auth)
- ✅ Lire/écrire dans Firestore
- ✅ Recevoir des notifications push (Firebase Messaging)

---

## 🆘 Dépannage

### Erreur : "GoogleService-Info.plist not found"

**Solution :**
1. Ouvre `ios/Runner.xcworkspace` dans Xcode
2. Vérifie que `GoogleService-Info.plist` apparaît dans le **Project Navigator**
3. Si non, re-fais l'étape 3 "Ajouter le fichier via Xcode"

### Erreur : "No such module 'Firebase'"

**Solution :**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
flutter clean
flutter pub get
```

### Erreur : Bundle ID mismatch

**Solution :**
1. Vérifie que le Bundle ID dans `GoogleService-Info.plist` = `com.projet.bus`
2. Vérifie que le Bundle ID dans Xcode = `com.projet.bus`
3. Re-télécharge `GoogleService-Info.plist` depuis Firebase Console si nécessaire

---

## 📝 Checklist

- [ ] `GoogleService-Info.plist` téléchargé depuis Firebase Console
- [ ] Fichier placé dans `ios/Runner/`
- [ ] Fichier ajouté au projet Xcode avec "Add to targets: Runner"
- [ ] Bundle ID = `com.projet.bus` partout
- [ ] `pod install` exécuté avec succès
- [ ] App lance sur simulateur iOS sans erreur
- [ ] Firebase Auth fonctionne
- [ ] Firestore fonctionne

---

**🎉 Une fois iOS configuré, ton app sera prête pour Android ET iOS !**

