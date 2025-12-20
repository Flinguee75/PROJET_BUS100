
/**
 * SimplifiedBusPopup - Helper pour générer le HTML des popups simplifiés
 * Layout épuré avec ratio géant en couleur et infos essentielles
 */

interface SimplifiedBusPopupOptions {
  busNumber: string;
  driverName?: string;
  driverPhone?: string;
  scannedCount: number;
  totalCount: number;
  onCenterClick?: string; // ID pour callback JavaScript
}

/**
 * Génère le HTML d'un popup simplifié pour un bus
 * @param options Configuration du popup
 * @returns HTML string pour le popup Mapbox
 */
export const generateSimplifiedBusPopupHTML = ({
  busNumber,
  driverName = 'Non assigné',
  driverPhone,
  scannedCount,
  totalCount,
  onCenterClick = '',
}: SimplifiedBusPopupOptions): string => {
  // Déterminer la couleur du ratio (vert si complet, rouge sinon)
  const isComplete = scannedCount === totalCount && totalCount > 0;
  const ratioColorClass = isComplete ? 'text-green-600' : 'text-red-600';
  const ratioBgClass = isComplete ? 'bg-green-50' : 'bg-red-50';

  // Icône de téléphone SVG
  const phoneIconSVG = driverPhone
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; margin-right:4px; vertical-align:-2px;">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>`
    : '';

  return `
    <div class="simplified-bus-popup" style="min-width:240px; font-family: Inter, system-ui, sans-serif;">
      <!-- Header: Numéro du bus + Ratio géant -->
      <div style="padding: 16px 16px 12px 16px; border-bottom: 1px solid #e5e7eb;">
        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
          Bus ${busNumber}
        </h3>
        <div class="popup-ratio-badge ${ratioBgClass}" style="display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 12px; border: 2px solid ${isComplete ? '#16a34a' : '#dc2626'};">
          <span class="${ratioColorClass}" style="font-size: 2rem; font-weight: 800; line-height: 1;">
            ${scannedCount}/${totalCount}
          </span>
        </div>
      </div>

      <!-- Body: Infos conducteur inline -->
      <div style="padding: 12px 16px;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #475569;">
          <span style="font-weight: 500;">👤</span>
          <span>${driverName}</span>
          ${driverPhone ? `<span style="margin-left: auto; color: #0284c7; cursor: pointer;" onclick="window.location.href='tel:${driverPhone}'">${phoneIconSVG}${driverPhone}</span>` : ''}
        </div>
      </div>

      <!-- Footer: Bouton centrer sur carte -->
      <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
        <button
          ${onCenterClick ? `onclick="${onCenterClick}"` : ''}
          style="width: 100%; background-color: #3b82f6; color: white; font-weight: 600; font-size: 14px; padding: 10px 16px; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s;"
          onmouseover="this.style.backgroundColor='#2563eb'"
          onmouseout="this.style.backgroundColor='#3b82f6'"
        >
          Centrer sur carte →
        </button>
      </div>
    </div>
  `;
};

/**
 * Génère le HTML d'un popup simplifié pour la zone de parking
 * @param studentNames Liste des prénoms d'élèves
 * @returns HTML string pour le popup
 */
export const generateParkingPopupHTML = (studentNames: string[]): string => {
  const studentCount = studentNames.length;

  // Limiter à 8 prénoms maximum avec "..." si plus
  const displayNames = studentNames.slice(0, 8);
  const hasMore = studentCount > 8;

  return `
    <div class="simplified-parking-popup" style="min-width: 200px; max-width: 280px; font-family: Inter, system-ui, sans-serif;">
      <!-- Header compact -->
      <div style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
        <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">
          Zone de parking
        </h4>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
          ${studentCount} élève${studentCount > 1 ? 's' : ''}
        </p>
      </div>

      <!-- Liste compacte des élèves -->
      <div style="padding: 8px 16px; max-height: 200px; overflow-y: auto;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${displayNames.map(name => `
            <li style="font-size: 13px; color: #475569; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
              ${name}
            </li>
          `).join('')}
          ${hasMore ? `
            <li style="font-size: 13px; color: #94a3b8; padding: 4px 0; font-style: italic;">
              ... et ${studentCount - 8} autre${studentCount - 8 > 1 ? 's' : ''}
            </li>
          ` : ''}
        </ul>
      </div>
    </div>
  `;
};
