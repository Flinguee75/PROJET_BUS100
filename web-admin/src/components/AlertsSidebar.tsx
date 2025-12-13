/**
 * Composant AlertsSidebar - Sidebar des alertes actives
 * Affiche uniquement les problèmes critiques (Management by Exception)
 */

import { AlertTriangle, Clock, Users, XCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Alert {
  id: string;
  type: 'DELAY' | 'STOPPED' | 'UNSCANNED_CHILD';
  busId: string;
  busNumber: string;
  severity: 'HIGH' | 'MEDIUM';
  message: string;
  timestamp: number;
}

interface AlertsSidebarProps {
  alerts: Alert[];
}

export const AlertsSidebar = ({ alerts }: AlertsSidebarProps) => {
  const navigate = useNavigate();

  const handleAlertClick = (busId: string) => {
    // TODO: Naviguer vers /buses/:busId/manifest quand la page sera créée
    console.log('Navigating to bus manifest:', busId);
    // navigate(`/buses/${busId}/manifest`);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'DELAY':
        return Clock;
      case 'STOPPED':
        return XCircle;
      case 'UNSCANNED_CHILD':
        return Users;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    return severity === 'HIGH'
      ? 'border-danger-300 bg-danger-50 hover:bg-danger-100'
      : 'border-warning-300 bg-warning-50 hover:bg-warning-100';
  };

  const getAlertTextColor = (severity: Alert['severity']) => {
    return severity === 'HIGH' ? 'text-danger-700' : 'text-warning-700';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes === 1) return 'Il y a 1 min';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return 'Il y a 1h';
    return `Il y a ${diffHours}h`;
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-900 font-display">
            Alertes Actives
          </h2>
          {alerts.length > 0 && (
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              alerts.some(a => a.severity === 'HIGH')
                ? 'bg-danger-600 text-white animate-pulse'
                : 'bg-warning-600 text-white'
            }`}>
              {alerts.length}
            </div>
          )}
        </div>
        <p className="text-sm text-slate-600">
          {alerts.length === 0
            ? 'Surveillance en temps réel'
            : `${alerts.filter(a => a.severity === 'HIGH').length} critique${alerts.filter(a => a.severity === 'HIGH').length > 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Liste des alertes */}
      <div className="flex-1 overflow-y-auto p-4">
        {alerts.length === 0 ? (
          // État vide - Tout va bien
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-success-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Tout est opérationnel
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aucune alerte active. Tous les bus sont à l'heure et les enfants sont scannés correctement.
            </p>
            <div className="mt-6 w-full space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span>Surveillance active</span>
              </div>
            </div>
          </div>
        ) : (
          // Liste des alertes
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              return (
                <button
                  key={alert.id}
                  onClick={() => handleAlertClick(alert.busId)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.severity === 'HIGH' ? 'bg-danger-200' : 'bg-warning-200'
                    }`}>
                      <Icon className={`w-5 h-5 ${getAlertTextColor(alert.severity)}`} strokeWidth={2.5} />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      {/* Bus number */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-lg ${getAlertTextColor(alert.severity)}`}>
                          Bus {alert.busNumber}
                        </span>
                        {alert.severity === 'HIGH' && (
                          <span className="px-2 py-0.5 bg-danger-600 text-white text-xs font-bold rounded-md">
                            URGENT
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <p className={`text-sm font-medium mb-2 ${getAlertTextColor(alert.severity)}`}>
                        {alert.message}
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-slate-500">
                        {formatTimestamp(alert.timestamp)}
                      </p>
                    </div>

                    {/* Flèche */}
                    <div className={`flex-shrink-0 ${getAlertTextColor(alert.severity)}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer avec statistiques */}
      {alerts.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-lg font-bold text-danger-600">
                {alerts.filter(a => a.type === 'DELAY').length}
              </div>
              <div className="text-xs text-slate-600">Retards</div>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-lg font-bold text-warning-600">
                {alerts.filter(a => a.type === 'STOPPED').length}
              </div>
              <div className="text-xs text-slate-600">Arrêts</div>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-lg font-bold text-warning-600">
                {alerts.filter(a => a.type === 'UNSCANNED_CHILD').length}
              </div>
              <div className="text-xs text-slate-600">Non scannés</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
