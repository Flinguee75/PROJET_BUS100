/**
 * Filtre de Kalman simplifié pour lissage GPS 2D
 * Réduit le bruit et les sauts dus aux imprécisions GPS
 *
 * Le filtre de Kalman est un algorithme de prédiction/correction qui estime
 * l'état d'un système dynamique (ici: position GPS) à partir de mesures bruitées.
 *
 * Principe:
 * 1. PREDICTION: Estimer la position future basée sur la vitesse
 * 2. UPDATE: Corriger l'estimation avec la mesure GPS réelle
 * 3. Le gain de Kalman détermine la confiance entre prédiction vs mesure
 */
export class GpsKalmanFilter {
  // État du système: position (x, y) + vitesse (vx, vy)
  private x: number; // latitude
  private y: number; // longitude
  private vx: number; // vitesse en latitude
  private vy: number; // vitesse en longitude

  // Matrices de covariance (représentent l'incertitude)
  private P: number[][]; // Covariance de l'état
  private Q: number; // Bruit de processus (incertitude du modèle)
  private R: number; // Bruit de mesure (incertitude du GPS)

  /**
   * Initialise un nouveau filtre de Kalman
   *
   * @param initialLat Latitude initiale
   * @param initialLng Longitude initiale
   * @param processNoise Bruit de processus (0.01 = confiance élevée dans le modèle)
   * @param measurementNoise Bruit de mesure GPS (20 = GPS précis à ~20m)
   */
  constructor(
    initialLat: number,
    initialLng: number,
    processNoise = 0.01,
    measurementNoise = 20
  ) {
    this.x = initialLat;
    this.y = initialLng;
    this.vx = 0;
    this.vy = 0;
    this.Q = processNoise;
    this.R = measurementNoise;

    // Initialiser matrice de covariance (incertitude initiale)
    this.P = [
      [this.R, 0, 0, 0],
      [0, this.R, 0, 0],
      [0, 0, this.Q, 0],
      [0, 0, 0, this.Q]
    ];
  }

  /**
   * Filtre une nouvelle position GPS mesurée
   *
   * Le filtre applique l'algorithme de Kalman en 2 étapes:
   * 1. PREDICTION: Estimer où le bus devrait être basé sur sa vitesse
   * 2. UPDATE: Corriger cette estimation avec la mesure GPS réelle
   *
   * @param measuredLat Latitude mesurée par GPS
   * @param measuredLng Longitude mesurée par GPS
   * @param dt Delta temps depuis la dernière mesure (secondes)
   * @returns Position filtrée (lissée)
   */
  filter(
    measuredLat: number,
    measuredLng: number,
    dt: number
  ): { lat: number; lng: number } {
    // === ÉTAPE 1: PREDICTION ===
    // Estimer la position future basée sur la vitesse actuelle
    const predictedX = this.x + this.vx * dt;
    const predictedY = this.y + this.vy * dt;

    // Augmenter l'incertitude de la prédiction (le modèle devient moins sûr avec le temps)
    this.P[0][0] += this.Q * dt;
    this.P[1][1] += this.Q * dt;

    // === ÉTAPE 2: UPDATE (CORRECTION) ===
    // Calculer le gain de Kalman (pondération entre prédiction vs mesure)
    // Gain proche de 0: on fait confiance à la prédiction
    // Gain proche de 1: on fait confiance à la mesure GPS
    const K_x = this.P[0][0] / (this.P[0][0] + this.R);
    const K_y = this.P[1][1] / (this.P[1][1] + this.R);

    // Corriger la position prédite avec la mesure GPS
    // Position finale = Prédiction + Gain × (Mesure - Prédiction)
    this.x = predictedX + K_x * (measuredLat - predictedX);
    this.y = predictedY + K_y * (measuredLng - predictedY);

    // Estimer la vitesse (dérivée première de la position)
    // Vitesse = (Position actuelle - Position prédite) / dt
    this.vx = (this.x - predictedX) / Math.max(dt, 0.1);
    this.vy = (this.y - predictedY) / Math.max(dt, 0.1);

    // Mettre à jour la covariance (réduire l'incertitude après la correction)
    this.P[0][0] = (1 - K_x) * this.P[0][0];
    this.P[1][1] = (1 - K_y) * this.P[1][1];

    return { lat: this.x, lng: this.y };
  }

  /**
   * Réinitialise le filtre avec une nouvelle position de départ
   * Utile si le bus fait un saut trop important (changement de route, etc.)
   *
   * @param lat Nouvelle latitude
   * @param lng Nouvelle longitude
   */
  reset(lat: number, lng: number): void {
    this.x = lat;
    this.y = lng;
    this.vx = 0;
    this.vy = 0;
  }

  /**
   * Récupère l'état actuel du filtre (pour debugging)
   *
   * @returns État actuel (position + vitesse + incertitude)
   */
  getState(): {
    position: { lat: number; lng: number };
    velocity: { vx: number; vy: number };
    uncertainty: number;
  } {
    return {
      position: { lat: this.x, lng: this.y },
      velocity: { vx: this.vx, vy: this.vy },
      uncertainty: Math.sqrt(this.P[0][0] * this.P[0][0] + this.P[1][1] * this.P[1][1]),
    };
  }
}
