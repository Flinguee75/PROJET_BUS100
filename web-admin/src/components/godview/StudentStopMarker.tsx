/**
 * Générateurs HTML pour les marqueurs d'arrêt d'élèves
 * Utilisé pour afficher les points de ramassage/dépose sur la carte GodView
 */

interface StudentStopMarkerOptions {
  order: number;
  status: 'pending' | 'scanned' | 'inactive';
}

/**
 * Génère le HTML pour un marqueur d'arrêt d'élève
 * Cercle coloré avec numéro d'ordre
 */
export const generateStudentStopMarkerHTML = ({
  order,
  status
}: StudentStopMarkerOptions): string => {
  const getColor = (): string => {
    switch (status) {
      case 'scanned':
        return '#16a34a'; // Vert-600 (élève déjà récupéré)
      case 'pending':
        return '#dc2626'; // Rouge-600 (pas encore récupéré)
      case 'inactive':
        return '#64748b'; // Gris-500 (inactif)
      default:
        return '#64748b';
    }
  };

  const color = getColor();

  return `
    <div class="student-stop-marker" style="
      width: 36px;
      height: 36px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      cursor: pointer;
      transition: all 0.2s;
    ">
      ${order}
    </div>
  `;
};

interface StudentStopPopupOptions {
  studentName: string;
  grade: string;
  address: string;
  order: number;
  status: 'pending' | 'scanned' | 'inactive';
}

/**
 * Génère le HTML pour la popup d'un arrêt d'élève
 * Affiche nom, classe, adresse et statut
 */
export const generateStudentStopPopupHTML = ({
  studentName,
  grade,
  address,
  order,
  status
}: StudentStopPopupOptions): string => {
  const statusLabel = status === 'scanned' ? 'Scanné' :
                     status === 'pending' ? 'En attente' : 'Inactif';
  const statusColor = status === 'scanned' ? '#16a34a' :
                     status === 'pending' ? '#dc2626' : '#64748b';

  return `
    <div class="student-stop-popup" style="min-width: 220px; font-family: Inter, system-ui, sans-serif;">
      <!-- Header: Badge d'ordre + Nom de l'élève -->
      <div style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <div style="
            background-color: ${statusColor};
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 13px;
          ">
            ${order}
          </div>
          <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">
            ${studentName}
          </h3>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>${grade}</span>
        </div>
      </div>

      <!-- Corps: Adresse -->
      <div style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px;">
          ADRESSE
        </div>
        <div style="font-size: 13px; color: #0f172a; line-height: 1.4;">
          ${address}
        </div>
      </div>

      <!-- Pied: Badge de statut -->
      <div style="padding: 10px 16px;">
        <div style="
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 6px;
          background-color: ${statusColor}20;
          border: 1px solid ${statusColor};
        ">
          <span style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${statusColor};
            margin-right: 6px;
          "></span>
          <span style="font-size: 12px; font-weight: 600; color: ${statusColor};">
            ${statusLabel}
          </span>
        </div>
      </div>
    </div>
  `;
};
