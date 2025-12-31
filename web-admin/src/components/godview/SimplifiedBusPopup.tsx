
/**
 * SimplifiedBusPopup - Helper pour générer le HTML des popups simplifiés
 * Layout épuré avec ratio géant en couleur et infos essentielles
 * Phase 4: Ajout du tracking de ramassage (dernier scan, prochain élève)
 */

interface SimplifiedBusPopupOptions {
  busNumber: string;
  busStatus?: string;
  driverName?: string;
  scannedCount: number;
  totalCount: number;
  onCenterClick?: string;
  tripStartLabel?: string;
  tripEndLabel?: string;
  scannedNames?: string[];
  missedNames?: string[];

  // NOUVEAUX champs pour Phase 4
  lastScan?: {
    studentName: string;
    minutesAgo: number;
  };
  nextStudent?: {
    studentName: string;
    stopOrder?: number;
  };
  speed?: number;
  tripDuration?: string;
  showTrackingToggle?: boolean;
  trackingEnabled?: boolean;
  onTrackingToggle?: string;
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
  scannedCount,
  totalCount,
  onCenterClick = '',
  tripStartLabel,
  tripEndLabel,
  scannedNames = [],
  missedNames = [],
  lastScan,
  nextStudent,
  tripDuration,
  showTrackingToggle = false,
  trackingEnabled = false,
  onTrackingToggle = '',
}: SimplifiedBusPopupOptions): string => {
  // Déterminer la couleur du ratio (vert si complet ou si bus ARRIVED, rouge sinon)
  const isArrived = busStatus === 'arrived';
  const isComplete = (scannedCount === totalCount && totalCount > 0) || isArrived;
  const ratioColorClass = isComplete ? 'text-green-600' : 'text-red-600';
  const ratioBgClass = isComplete ? 'bg-green-50' : 'bg-red-50';

  return `
    <div class="simplified-bus-popup" style="min-width:240px; font-family: Inter, system-ui, sans-serif;">
      <!-- Header: Numéro du bus + Ratio géant -->
      <div style="padding: 16px; border-bottom: 1px solid #e5e7eb; position: relative;">
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
      ${!isArrived && (scannedCount > 0 || (totalCount - scannedCount) > 0) ? `
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

      ${isArrived ? `
        <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <h4 style="font-size: 12px; font-weight: 600; color: #64748b; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 3h14M5 9h14M5 15h14M5 21h14"/>
            </svg>
            COURSE TERMINÉE
          </h4>
          <div style="font-size: 13px; color: #0f172a; display: grid; gap: 4px;">
            ${tripStartLabel ? `<div>Départ: <strong>${tripStartLabel}</strong></div>` : ''}
            ${tripEndLabel ? `<div>Arrivée: <strong>${tripEndLabel}</strong></div>` : ''}
            ${tripDuration ? `<div>Durée: <strong>${tripDuration}</strong></div>` : ''}
          </div>
        </div>
      ` : ''}

      ${isArrived && (scannedNames.length > 0 || missedNames.length > 0) ? `
        <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <h4 style="font-size: 12px; font-weight: 600; color: #64748b; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
            </svg>
            RAMASSAGE
          </h4>
          <div style="display: grid; gap: 10px;">
            ${scannedNames.length > 0 ? `
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #16a34a; margin-bottom: 6px;">
                  Ramassés (${scannedNames.length})
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${scannedNames.map((name) => `
                    <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 999px;">
                      ${name}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            ${missedNames.length > 0 ? `
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #dc2626; margin-bottom: 6px;">
                  Non ramassés (${missedNames.length})
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${missedNames.map((name) => `
                    <span style="background: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 999px;">
                      ${name}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
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
            <div style="font-weight: 600;">
              ${nextStudent.stopOrder ? `#${nextStudent.stopOrder} — ` : ''}${nextStudent.studentName}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Statut actuel (durée) -->
      ${!isArrived && tripDuration ? `
        <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 13px; color: #475569;">
            <span>Trajet: ${tripDuration}</span>
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
        </div>
      </div>

      <!-- Footer: Boutons d'action -->
      <div style="padding: 12px 16px; border-top: 1px solid #e5e7eb; display: grid; gap: 8px;">
        ${showTrackingToggle ? `
          <button
            ${onTrackingToggle ? `onclick="${onTrackingToggle}"` : ''}
            style="width: 100%; background-color: ${trackingEnabled ? '#0f172a' : '#e2e8f0'}; color: ${trackingEnabled ? '#ffffff' : '#0f172a'}; font-weight: 700; font-size: 13px; padding: 9px 14px; border: none; border-radius: 8px; cursor: pointer;"
          >
            ${trackingEnabled ? 'Suivi actif' : 'Suivre le bus'}
          </button>
        ` : ''}
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
