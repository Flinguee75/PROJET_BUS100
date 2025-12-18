/**
 * BusMarkerWithAura - Helper pour générer le HTML des marqueurs de bus
 * Génère des flèches directionnelles avec aura pulsante pour les bus avec alertes
 */

interface MarkerOptions {
  busNumber: string;
  color: string;
  rotation: number;
  hasAlert: boolean;
  alertSeverity?: 'HIGH' | 'MEDIUM';
}

/**
 * Génère le HTML d'un marqueur de bus avec flèche directionnelle
 * @param options Configuration du marqueur
 * @returns HTML string pour le marqueur
 */
export const generateBusMarkerHTML = ({
  busNumber: _busNumber, // Reserved for future use (Phase 4 may display on marker)
  color,
  rotation,
  hasAlert,
  alertSeverity = 'MEDIUM',
}: MarkerOptions): string => {
  // Classe d'animation selon la sévérité de l'alerte
  const auraClass = hasAlert
    ? (alertSeverity === 'HIGH' ? 'animate-pulse-aura-red' : 'animate-pulse-aura-orange')
    : '';

  // SVG flèche pointant vers le haut (sera tourné selon rotation)
  const arrowSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
      <!-- Flèche directionnelle pointant vers le haut -->
      <path d="M12 1 L18 9 L15 9 L15 18 C15 19.1 14.1 20 13 20 L11 20 C9.9 20 9 19.1 9 18 L9 9 L6 9 Z" fill="white" stroke="none"/>
      <!-- Cercle pour la base du bus -->
      <circle cx="12" cy="20" r="2.5" fill="white"/>
    </svg>
  `;

  return `
    <div class="bus-marker-container ${auraClass}">
      <div class="bus-marker-arrow" style="transform: rotate(${rotation}deg); background-color: ${color};">
        ${arrowSVG}
      </div>
    </div>
  `;
};

/**
 * Calcule l'angle de rotation du marqueur vers l'école
 * @param busPosition Position actuelle du bus
 * @param schoolPosition Position de l'école
 * @returns Angle en degrés (0° = Nord)
 */
export const calculateHeadingToSchool = (
  busPosition: { lat: number; lng: number },
  schoolPosition: { lat: number; lng: number }
): number => {
  const dx = schoolPosition.lng - busPosition.lng;
  const dy = schoolPosition.lat - busPosition.lat;

  // Math.atan2 retourne angle où 0° = Est
  // Pour CSS rotate où 0° = Nord, on convertit : angle - 90°
  const angleRadians = Math.atan2(dy, dx);
  let rotation = (angleRadians * 180) / Math.PI - 90;

  // Normaliser entre 0 et 360
  if (rotation < 0) {
    rotation += 360;
  }

  return rotation;
};
