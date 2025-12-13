/**
 * Types pour les alertes temps réel
 */

export type AlertType = 'DELAY' | 'STOPPED' | 'UNSCANNED_CHILD';
export type AlertSeverity = 'HIGH' | 'MEDIUM';

export interface Alert {
  id: string;
  type: AlertType;
  busId: string;
  busNumber: string;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
}
