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
  /** Nombre d'élèves déjà scannés sur la course en cours. */
  scannedCount?: number;
  /** Nombre total d'élèves de la tournée. */
  totalCount?: number;
}

const escape = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });

/**
 * Génère le HTML d'un marqueur de bus avec flèche directionnelle et étiquette
 * flottante (numéro + ratio scannés) au-dessus du marqueur.
 */
export const generateBusMarkerHTML = ({
  busNumber,
  color,
  rotation,
  hasAlert,
  alertSeverity = 'MEDIUM',
  scannedCount,
  totalCount,
}: MarkerOptions): string => {
  const auraClass = hasAlert
    ? alertSeverity === 'HIGH'
      ? 'animate-pulse-aura-red'
      : 'animate-pulse-aura-orange'
    : '';

  const ratioPart =
    totalCount != null && totalCount > 0
      ? `<span class="bus-marker-label__ratio">${scannedCount ?? 0}/${totalCount}</span>`
      : '';

  const labelHTML = `
    <div class="bus-marker-label">
      <span class="bus-marker-label__number">${escape(busNumber)}</span>
      ${ratioPart}
    </div>
  `;

  const busSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L3 21l9-4 9 4-9-19z"/>
    </svg>
  `;

  return `
    <div class="bus-marker-container ${auraClass}">
      ${labelHTML}
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
  const dLng = schoolPosition.lng - busPosition.lng;
  const dLat = schoolPosition.lat - busPosition.lat;

  let rotation = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  if (rotation < 0) rotation += 360;

  return rotation;
};
