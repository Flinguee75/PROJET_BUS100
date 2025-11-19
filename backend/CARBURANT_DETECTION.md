# 🔧 Détection Carburant - Solutions Techniques

## 📊 Vue d'ensemble des Solutions

| Niveau | Coût | Précision | Délai | Données Obtenues |
|--------|------|-----------|-------|------------------|
| **MVP (GPS seul)** | Gratuit | 70-80% | Immédiat | Ralenti, immobilisation |
| **Smartphone + OBD** | ~50€/bus | 90% | 1 semaine | Conso réelle, niveau |
| **Capteur professionnel** | ~200€/bus | 95%+ | 1 mois | Tout + alertes temps réel |
| **Carte carburant** | Service | 100% | Immédiat | Ravitaillements historiques |

---

## 🎯 **Niveau 1 : GPS + Heuristiques (ACTUEL)**

### Données Disponibles
- ✅ Position GPS (lat, lng)
- ✅ Vitesse instantanée
- ✅ Timestamp des positions
- ✅ Historique de trajet

### Détections Intelligentes

#### 1. **Ralenti Excessif** (Gaspillage Actif)
```typescript
// Bus arrêté + GPS actif = moteur probablement allumé
if (speed === 0 && minutesSinceLastUpdate < 15 && minutesSinceLastUpdate > 10) {
  alertesRalenti++;
  // Économie estimée : 1-2 litres/heure de ralenti
}
```

**Scénario typique Abidjan :**
- Chauffeur arrive 30 min en avance à l'école
- Laisse la clim tourner en attendant les élèves
- **Coût** : ~1.5L × 750 FCFA = 1125 FCFA gaspillés

#### 2. **Trajet Inefficace** (Surconsommation)
```typescript
// Calculer la consommation théorique vs distance parcourue
const distanceParcourue = calculerDistance(gpsHistory);
const tempsTrajet = gpsHistory[last].timestamp - gpsHistory[first].timestamp;
const vitesseMoyenne = distanceParcourue / (tempsTrajet / 3600);

// Si vitesse moyenne < 15 km/h sur Abidjan = bouchons = surconsommation
if (vitesseMoyenne < 15) {
  alerteSurconsommation = true;
  // Conso réelle : ~20-25L/100km au lieu de 12-15L/100km
}
```

#### 3. **Immobilisation Anormale** (Panne Sèche Potentielle)
```typescript
if (speed === 0 && minutesSinceLastUpdate > 30) {
  alerteCarburant++; // Peut-être en panne sèche
  // Action : Appeler le chauffeur immédiatement
}
```

#### 4. **Écart vs Itinéraire Prévu** (Détour = Carburant)
```typescript
// Comparer la distance réelle vs distance optimale
const distanceReelle = calculerDistanceGPS(gpsHistory);
const distanceOptimale = itineraire.distancePrevu;
const ecartPourcent = ((distanceReelle - distanceOptimale) / distanceOptimale) * 100;

if (ecartPourcent > 20) {
  alerteDetour = true;
  // Carburant gaspillé : écart × consommation moyenne
}
```

### Implémentation Améliorée

```typescript
// backend/src/services/fuel.estimation.service.ts

export class FuelEstimationService {
  // Consommation moyenne d'un bus scolaire (litres/100km)
  private readonly CONSO_NORMALE = 15;
  private readonly CONSO_BOUCHONS = 22;
  private readonly CONSO_RALENTI_HEURE = 1.5;
  private readonly PRIX_LITRE = 750; // FCFA

  /**
   * Estime la consommation et détecte les gaspillages
   */
  async analyserConsommation(busId: string, date: string) {
    const gpsHistory = await this.getGPSHistory(busId, date);
    
    // 1. Calculer distance parcourue
    const distance = this.calculerDistance(gpsHistory);
    
    // 2. Détecter périodes de ralenti
    const minutesRalenti = this.detecterRalenti(gpsHistory);
    
    // 3. Calculer vitesse moyenne
    const vitesseMoyenne = this.calculerVitesseMoyenne(gpsHistory);
    
    // 4. Estimer consommation
    const consoRoute = vitesseMoyenne < 15 
      ? (distance / 100) * this.CONSO_BOUCHONS
      : (distance / 100) * this.CONSO_NORMALE;
    
    const consoRalenti = (minutesRalenti / 60) * this.CONSO_RALENTI_HEURE;
    
    const consoTotale = consoRoute + consoRalenti;
    const coutEstime = consoTotale * this.PRIX_LITRE;
    
    // 5. Déterminer alertes
    const alertes = [];
    
    if (minutesRalenti > 15) {
      alertes.push({
        type: 'ralenti_excessif',
        duree: minutesRalenti,
        gaspillage: consoRalenti * this.PRIX_LITRE,
        message: `${minutesRalenti} min de ralenti = ${Math.round(consoRalenti * this.PRIX_LITRE)} FCFA gaspillés`
      });
    }
    
    if (vitesseMoyenne < 12) {
      alertes.push({
        type: 'surconsommation_bouchons',
        vitesseMoyenne,
        surCout: (consoRoute - (distance / 100) * this.CONSO_NORMALE) * this.PRIX_LITRE,
        message: `Bouchons : +${Math.round(((this.CONSO_BOUCHONS - this.CONSO_NORMALE) / this.CONSO_NORMALE) * 100)}% de conso`
      });
    }
    
    return {
      distance,
      vitesseMoyenne,
      minutesRalenti,
      consoEstimee: consoTotale,
      coutEstime,
      alertes
    };
  }

  private calculerDistance(gpsHistory: GPSPosition[]): number {
    let distance = 0;
    for (let i = 1; i < gpsHistory.length; i++) {
      distance += this.haversineDistance(
        gpsHistory[i-1].lat, gpsHistory[i-1].lng,
        gpsHistory[i].lat, gpsHistory[i].lng
      );
    }
    return distance; // km
  }

  private detecterRalenti(gpsHistory: GPSPosition[]): number {
    let minutesRalenti = 0;
    for (let i = 1; i < gpsHistory.length; i++) {
      const timeDiff = (gpsHistory[i].timestamp - gpsHistory[i-1].timestamp) / 60000; // minutes
      if (gpsHistory[i].speed === 0 && timeDiff < 5) { // Arrêt court = ralenti probable
        minutesRalenti += timeDiff;
      }
    }
    return minutesRalenti;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
```

---

## 📱 **Niveau 2 : Smartphone + Adaptateur OBD-II (Recommandé)**

### Matériel Nécessaire

**Adaptateur OBD-II Bluetooth** (~30-50€/bus)
- Marques : ELM327, VGATE iCar Pro, BlueDriver
- Se branche sur la prise OBD du bus (sous le volant)
- Communique via Bluetooth avec un smartphone

**Application Mobile** (à développer ou utiliser existante)
- Torque Pro (Android) - 5€
- Car Scanner (iOS/Android) - Gratuit
- OU développer une app Flutter custom

### Données Obtenues (Temps Réel)

✅ **Niveau carburant** (%)  
✅ **Consommation instantanée** (L/100km)  
✅ **Consommation moyenne**  
✅ **Distance parcourue**  
✅ **Moteur allumé/éteint** (RPM)  
✅ **Température moteur**  
✅ **Codes d'erreur** (maintenance préventive)

### Implémentation

```typescript
// Types pour OBD-II
interface OBDData {
  busId: string;
  timestamp: number;
  fuelLevel: number;        // % (0-100)
  instantConso: number;     // L/100km
  avgConso: number;         // L/100km
  rpm: number;              // Tours/min (0 = moteur éteint)
  engineTemp: number;       // °C
  distanceSinceStart: number; // km
  errorCodes: string[];     // P0XXX codes
}

// Service de collecte OBD
export class OBDService {
  /**
   * Recevoir les données OBD depuis l'app mobile chauffeur
   */
  async receiveOBDData(data: OBDData) {
    const db = getDb();
    
    // 1. Stocker dans Firestore
    await db.collection('obd_live').doc(data.busId).set({
      ...data,
      updatedAt: new Date()
    });
    
    // 2. Détecter alertes
    const alertes = [];
    
    // Niveau carburant bas
    if (data.fuelLevel < 20) {
      alertes.push({
        type: 'carburant_bas',
        niveau: data.fuelLevel,
        urgence: data.fuelLevel < 10 ? 'critique' : 'warning'
      });
    }
    
    // Ralenti excessif (moteur allumé, vitesse 0)
    if (data.rpm > 500 && data.speed === 0) {
      const ralentiDuration = await this.getRalentiDuration(data.busId);
      if (ralentiDuration > 10) {
        alertes.push({
          type: 'ralenti_excessif',
          duree: ralentiDuration,
          rpm: data.rpm
        });
      }
    }
    
    // Surconsommation anormale
    const consoNormale = 15;
    if (data.instantConso > consoNormale * 1.5) {
      alertes.push({
        type: 'surconsommation',
        conso: data.instantConso,
        ecart: Math.round(((data.instantConso - consoNormale) / consoNormale) * 100)
      });
    }
    
    // 3. Envoyer notifications si nécessaire
    if (alertes.length > 0) {
      await this.sendFuelAlerts(data.busId, alertes);
    }
    
    return { success: true, alertes };
  }
}
```

### Intégration App Chauffeur

```dart
// mobile-driver/lib/services/obd_service.dart

class OBDService {
  late BluetoothConnection connection;
  
  // Se connecter à l'adaptateur OBD
  Future<void> connectOBD(String deviceAddress) async {
    connection = await BluetoothConnection.toAddress(deviceAddress);
    startOBDMonitoring();
  }
  
  // Lire les données OBD en continu
  void startOBDMonitoring() {
    Timer.periodic(Duration(seconds: 5), (timer) async {
      // Lire niveau carburant
      String fuelLevel = await sendOBDCommand('01 2F'); // PID 0x2F
      
      // Lire consommation
      String conso = await sendOBDCommand('01 5E'); // PID 0x5E
      
      // Lire RPM
      String rpm = await sendOBDCommand('01 0C'); // PID 0x0C
      
      // Envoyer au backend
      await sendToBackend({
        'busId': currentBusId,
        'fuelLevel': parseFuelLevel(fuelLevel),
        'instantConso': parseConso(conso),
        'rpm': parseRPM(rpm),
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
    });
  }
}
```

### Avantages Niveau 2
✅ **Données réelles** du calculateur du bus  
✅ **Coût faible** (~50€/bus)  
✅ **Installation simple** (brancher et connecter)  
✅ **Maintenance préventive** (codes erreur OBD)  
✅ **Détection moteur allumé/éteint** (RPM réel)

---

## 🏢 **Niveau 3 : Capteur Professionnel (Production)**

### Capteurs GPS + Carburant Intégrés

**Exemples :**
- **Teltonika FMB920** (~150€) : GPS + connecteur carburant
- **Queclink GV300** (~200€) : GPS + CAN bus + capteurs
- **CalAmp LMU-4520** (~250€) : Solution complète flotte

### Données Obtenues
✅ **Position GPS haute précision**  
✅ **Niveau carburant temps réel** (jauge résistive)  
✅ **Consommation précise**  
✅ **Détection vol carburant**  
✅ **Alertes automatiques** (bas niveau, surconsommation)  
✅ **Rapport mensuel** automatique

### Installation
- Capteur jauge carburant dans le réservoir
- Boîtier GPS/GPRS connecté
- Alimentation 12V du bus
- Carte SIM pour transmission données

### Avantages Niveau 3
✅ **Précision maximale** (±2%)  
✅ **Détection vol carburant**  
✅ **Pas besoin app chauffeur**  
✅ **Données 24/7** automatiques  
✅ **Alertes temps réel**

---

## 💳 **Niveau 4 : Carte Carburant (Parallèle)**

### Systèmes de Cartes Prépayées

**Fournisseurs Côte d'Ivoire :**
- Total Access
- Shell Fleet Card
- Autres distributeurs locaux

### Ce que ça apporte
✅ **Traçabilité complète** : Qui a ravitaillé quand et où  
✅ **Contrôle budget** : Plafond mensuel par bus  
✅ **Détection fraude** : Ravitaillements suspects  
✅ **Rapports automatiques** : Conso mensuelle par bus  
✅ **Historique** : Analyse tendances

### Intégration Backend

```typescript
// Récupérer les ravitaillements via API du fournisseur
interface Ravitaillement {
  busId: string;
  date: Date;
  station: string;
  litres: number;
  montant: number;
  kilometrage: number;
}

// Calculer consommation réelle
const consoReelle = litres / (kilometrageActuel - dernierRavitaillement.kilometrage) * 100;

// Comparer avec estimation GPS
if (consoReelle > consoEstimeeGPS * 1.3) {
  alerte('Surconsommation détectée ou fuite carburant');
}
```

---

## 🎯 **Recommandation pour Votre Projet**

### Phase MVP (Maintenant → 3 mois)
✅ **GPS + Heuristiques** (gratuit, déjà implémenté)
- Détecter ralenti excessif
- Estimer consommation
- Alerter immobilisation

### Phase 2 (3-6 mois)
✅ **OBD-II Bluetooth** (~50€/bus)
- Acheter 2-3 adaptateurs pour test
- Intégrer dans app chauffeur
- Valider données vs estimations GPS

### Phase 3 (6-12 mois)
✅ **Carte Carburant** (service)
- Négocier avec fournisseur local
- Déployer sur toute la flotte
- Croiser données OBD + Carte

### Phase 4 (12+ mois) - Si Croissance
✅ **Capteurs Professionnels** (~200€/bus)
- Pour les bus critiques d'abord
- Détection vol carburant
- Solution 100% automatique

---

## 💡 **Solution Hybride Recommandée**

```
┌─────────────────────────────────────────┐
│  NIVEAU 1 : GPS (Tous les bus)         │ ← Immédiat
│  - Ralenti excessif                     │
│  - Trajets inefficaces                  │
│  - Estimation consommation              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  NIVEAU 2 : OBD-II (Bus tests)         │ ← 1-3 mois
│  - Niveau carburant réel                │
│  - Consommation instantanée             │
│  - Validation estimations GPS           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  NIVEAU 4 : Carte Carburant (Flotte)   │ ← 3-6 mois
│  - Ravitaillements tracés               │
│  - Contrôle budget                      │
│  - Détection fraude                     │
└─────────────────────────────────────────┘
```

**Coût Total Phase 1-2 :** ~50€ × 10 bus = 500€  
**ROI Attendu :** Économie 10-15% carburant = ~1000€/mois  
**Retour sur investissement :** < 1 mois

---

## 📝 **Action Immédiate**

1. ✅ **Utiliser l'implémentation actuelle** (GPS seul) pour commencer
2. 🛒 **Commander 2-3 adaptateurs OBD-II** (~100€) pour test
3. 📞 **Contacter Total/Shell** pour devis carte carburant
4. 📊 **Analyser 1 mois de données GPS** pour valider modèle

---

**Voulez-vous que je développe le service d'estimation de consommation complet (Niveau 1 amélioré) ?**

