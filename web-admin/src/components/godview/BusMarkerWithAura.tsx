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

  // SVG bus (style proche du marqueur école: fond blanc, contour coloré)
  const busSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 6v6"/>
      <path d="M15 6v6"/>
      <path d="M2 12h19.6"/>
      <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
      <circle cx="7" cy="18" r="2"/>
      <path d="M9 18h5"/>
      <circle cx="16" cy="18" r="2"/>
    </svg>
  `;

  return `
    <div class="bus-marker-container ${auraClass}">
      <div class="bus-marker-arrow" style="transform: rotate(${rotation}deg); background-color: #ffffff; color: ${color}; border-color: ${color};">
        ${busSVG}
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
