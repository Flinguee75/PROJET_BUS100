import { X, MapPin, Users, Clock, Navigation, Crosshair } from 'lucide-react';
import { BusLiveStatus, type BusRealtimeData } from '@/types/realtime';

interface BusDetailPanelProps {
  bus: BusRealtimeData;
  studentCounts: { scanned: number; unscanned: number; total: number };
  roster?: { scannedNames?: string[]; missedNames?: string[] };
  arrivedAt?: number | null;
  isTracking: boolean;
  onClose: () => void;
  onCenter: () => void;
  onToggleTrack: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  [BusLiveStatus.EN_ROUTE]: { label: 'En route',   dot: 'bg-blue-500',   text: 'text-blue-700'  },
  [BusLiveStatus.DELAYED]:  { label: 'En retard',  dot: 'bg-red-500',    text: 'text-red-700'   },
  [BusLiveStatus.ARRIVED]:  { label: 'Arrivé',     dot: 'bg-green-500',  text: 'text-green-700' },
  [BusLiveStatus.STOPPED]:  { label: 'Stationné',  dot: 'bg-slate-400',  text: 'text-slate-600' },
  [BusLiveStatus.IDLE]:     { label: 'En attente', dot: 'bg-slate-400',  text: 'text-slate-600' },
};

const fmtDuration = (ms: number): string => {
  if (ms < 60_000) return '< 1 min';
  const m = Math.floor(ms / 60_000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h${String(m % 60).padStart(2, '0')}` : `${m} min`;
};

const fmtClock = (ts: number | null | undefined): string => {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const fmtAgo = (ts: number): string => {
  const m = Math.floor((Date.now() - ts) / 60_000);
  if (m < 1) return 'À l\'instant';
  if (m === 1) return 'Il y a 1 min';
  return `Il y a ${m} min`;
};

export const BusDetailPanel = ({
  bus,
  studentCounts,
  roster,
  arrivedAt,
  isTracking,
  onClose,
  onCenter,
  onToggleTrack,
}: BusDetailPanelProps) => {
  const status = bus.liveStatus ?? BusLiveStatus.IDLE;
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[BusLiveStatus.IDLE];

  const isEnRoute = status === BusLiveStatus.EN_ROUTE || status === BusLiveStatus.DELAYED;
  const isArrived = status === BusLiveStatus.ARRIVED;

  const scanned = studentCounts?.scanned ?? 0;
  const total   = studentCounts?.total   ?? 0;
  const pct     = total > 0 ? Math.round((scanned / total) * 100) : 0;
  const allBoarded = total > 0 && scanned === total;

  const speed = Math.round(bus.currentPosition?.speed ?? 0);

  const tripDuration = bus.tripStartTime
    ? fmtDuration((arrivedAt ?? Date.now()) - bus.tripStartTime)
    : null;

  return (
    <div className="w-72 h-full bg-white border-l border-slate-200 flex flex-col flex-shrink-0 shadow-lg z-10">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{bus.number}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Ratio élèves */}
      {total > 0 && (
        <div className={`mx-4 mt-4 rounded-xl p-3 flex items-center justify-between ${allBoarded ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}`}>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Élèves à bord</p>
            <p className={`text-2xl font-black ${allBoarded ? 'text-green-700' : 'text-slate-900'}`}>
              {scanned}<span className="text-base font-semibold text-slate-400">/{total}</span>
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black ${allBoarded ? 'text-green-600' : pct >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>{pct}%</p>
            <p className="text-xs text-slate-400 font-medium">scannés</p>
          </div>
        </div>
      )}

      {/* Infos détaillées */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Conducteur */}
        {bus.driver?.name && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Conducteur</p>
              <p className="text-sm font-semibold text-slate-800">{bus.driver.name}</p>
            </div>
          </div>
        )}

        {/* Zone / localisation */}
        {(isEnRoute || isArrived) && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Localisation</p>
              <p className="text-sm font-semibold text-slate-800 truncate">
                {bus.currentZone || bus.route?.name || 'En déplacement'}
              </p>
            </div>
          </div>
        )}

        {/* Vitesse + durée trajet */}
        {isEnRoute && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Navigation className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} />
            </div>
            <div className="flex gap-4">
              {speed > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-medium">Vitesse</p>
                  <p className="text-sm font-semibold text-slate-800">{speed} km/h</p>
                </div>
              )}
              {tripDuration && (
                <div>
                  <p className="text-xs text-slate-400 font-medium">Trajet</p>
                  <p className="text-sm font-semibold text-slate-800">{tripDuration}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Horaires */}
        {bus.tripStartTime && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-500" strokeWidth={2.5} />
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-slate-400 font-medium">Départ</p>
                <p className="text-sm font-semibold text-slate-800">{fmtClock(bus.tripStartTime)}</p>
              </div>
              {(isArrived && arrivedAt) && (
                <div>
                  <p className="text-xs text-slate-400 font-medium">Arrivée</p>
                  <p className="text-sm font-semibold text-green-700">{fmtClock(arrivedAt)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dernier scan */}
        {bus.lastScan && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-0.5">Dernier scan</p>
            <p className="text-sm font-semibold text-blue-900">{bus.lastScan.studentName}</p>
            <p className="text-xs text-blue-400">{fmtAgo(bus.lastScan.timestamp)}</p>
          </div>
        )}

        {/* Élèves manquants */}
        {roster?.missedNames && roster.missedNames.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1.5">
              En attente ({roster.missedNames.length})
            </p>
            <ul className="space-y-1">
              {roster.missedNames.slice(0, 5).map((name, i) => (
                <li key={i} className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {name}
                </li>
              ))}
              {roster.missedNames.length > 5 && (
                <li className="text-xs text-amber-500">+ {roster.missedNames.length - 5} autres</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex gap-2">
        <button
          onClick={onCenter}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5" strokeWidth={2.5} />
          Centrer
        </button>
        {isEnRoute && (
          <button
            onClick={onToggleTrack}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
              isTracking
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" strokeWidth={2.5} />
            {isTracking ? 'Suivre ✓' : 'Suivre'}
          </button>
        )}
      </div>
    </div>
  );
};
