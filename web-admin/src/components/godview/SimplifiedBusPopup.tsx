
/**
 * SimplifiedBusPopup - Helper pour générer le HTML des popups simplifiés
 * Layout épuré avec ratio géant en couleur et infos essentielles
 * Phase 4: Ajout du tracking de ramassage (dernier scan, prochain élève)
 */

interface SimplifiedBusPopupOptions {
  busNumber: string;
  busStatus?: string;
  driverName?: string;
  driverPhone?: string;
  scannedCount: number;
  totalCount: number;
  onCenterClick?: string;

  // NOUVEAUX champs pour Phase 4
  lastScan?: {
    studentName: string;
    minutesAgo: number;
  };
  nextStudent?: {
    studentName: string;
  };
  speed?: number;
  tripDuration?: string;
}

/**
 * Génère le HTML d'un popup simplifié pour un bus
 * @param options Configuration du popup
 * @returns HTML string pour le popup Mapbox
 */
export const generateSimplifiedBusPopupHTML = ({
  busNumber,
  busStatus,
  driverName = 'Non assigné',
  driverPhone,
  scannedCount,
  totalCount,
  onCenterClick = '',
  lastScan,
  nextStudent,
  speed,
  tripDuration,
}: SimplifiedBusPopupOptions): string => {
  // Déterminer la couleur du ratio (vert si complet ou si bus ARRIVED, rouge sinon)
  const isArrived = busStatus === 'arrived';
  const isComplete = (scannedCount === totalCount && totalCount > 0) || isArrived;
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
      <div style="padding: 16px 16px 12px 16px; border-bottom: 1px solid #e5e7eb; position: relative;">
        <button class="bus-popup-close" aria-label="Fermer le popup">×</button>
        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
          ${busNumber}
        </h3>
        <div class="popup-ratio-badge ${ratioBgClass}" style="display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 12px; border: 2px solid ${isComplete ? '#16a34a' : '#dc2626'};">
          <span class="${ratioColorClass}" style="font-size: 2rem; font-weight: 800; line-height: 1;">
            ${scannedCount}/${totalCount}
          </span>
        </div>
      </div>

      <!-- NOUVEAU: Section Ramassage en cours -->
      ${scannedCount > 0 || (totalCount - scannedCount) > 0 ? `
        <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <h4 style="font-size: 12px; font-weight: 600; color: #64748b; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
            </svg>
            RAMASSAGE EN COURS
          </h4>
          <div style="font-size: 13px; color: #0f172a;">
            <span style="font-weight: 600; color: #16a34a;">${scannedCount}</span> élève${scannedCount > 1 ? 's' : ''} à bord •
            <span style="font-weight: 600; color: #dc2626;">${totalCount - scannedCount}</span> restant${totalCount - scannedCount > 1 ? 's' : ''}
          </div>
        </div>
      ` : ''}

      <!-- NOUVEAU: Dernier scan -->
      ${lastScan ? `
        <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <h4 style="font-size: 12px; font-weight: 600; color: #64748b; margin: 0 0 6px 0; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            DERNIER SCAN
          </h4>
          <div style="font-size: 13px; color: #0f172a;">
            <div style="font-weight: 600;">${lastScan.studentName}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              il y a ${lastScan.minutesAgo} min
            </div>
          </div>
        </div>
      ` : ''}

      <!-- NOUVEAU: Prochain élève -->
      ${nextStudent ? `
        <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <h4 style="font-size: 12px; font-weight: 600; color: #64748b; margin: 0 0 6px 0; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            PROCHAIN ÉLÈVE
          </h4>
          <div style="font-size: 13px; color: #0f172a;">
            <div style="font-weight: 600;">${nextStudent.studentName}</div>
          </div>
        </div>
      ` : ''}

      <!-- Statut actuel (vitesse, durée) -->
      ${speed !== undefined || tripDuration ? `
        <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 13px; color: #475569;">
            ${speed !== undefined ? `<span style="font-weight: 600;">${Math.round(speed)} km/h</span>` : ''}
            ${tripDuration ? `<span style="margin-left: 8px;">• ${tripDuration}</span>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Body: Infos conducteur inline -->
      <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #475569;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
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

interface ParkingBusInfo {
  busNumber: string;
  driverName?: string;
}

/**
 * Génère le HTML d'un popup simplifié pour la zone de parking
 * @param buses Liste des bus avec leurs chauffeurs
 * @returns HTML string pour le popup
 */
export const generateParkingPopupHTML = (buses: ParkingBusInfo[]): string => {
  const busCount = buses.length;

  // Limiter à 8 bus maximum avec "..." si plus
  const displayBuses = buses.slice(0, 8);
  const hasMore = busCount > 8;

  return `
    <div class="simplified-parking-popup" style="min-width: 200px; max-width: 280px; font-family: Inter, system-ui, sans-serif;">
      <!-- Header compact -->
      <div style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
        <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">
          Zone de parking
        </h4>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">
          ${busCount} bus
        </p>
      </div>

      <!-- Liste compacte des bus -->
      <div style="padding: 8px 16px; max-height: 200px; overflow-y: auto;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${displayBuses.map(bus => `
            <li style="font-size: 13px; color: #475569; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
              <div style="font-weight: 600; color: #0f172a;">${bus.busNumber}</div>
              ${bus.driverName ? `
                <div style="font-size: 12px; color: #64748b; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  ${bus.driverName}
                </div>
              ` : ''}
            </li>
          `).join('')}
          ${hasMore ? `
            <li style="font-size: 13px; color: #94a3b8; padding: 4px 0; font-style: italic;">
              ... et ${busCount - 8} autre${busCount - 8 > 1 ? 's' : ''}
            </li>
          ` : ''}
        </ul>
      </div>
    </div>
  `;
};
