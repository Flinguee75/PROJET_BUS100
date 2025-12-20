/**
 * Section "Bus Arrivés Récemment"
 * Affiche les bus en statut ARRIVED (derniers 15 minutes)
 */

import { Clock, MapPin } from 'lucide-react';
import type { BusRealtimeData } from '@/types/realtime';

interface RecentlyArrivedSectionProps {
  buses: BusRealtimeData[];
  onBusClick?: (busId: string) => void;
}

export const RecentlyArrivedSection = ({ buses, onBusClick }: RecentlyArrivedSectionProps) => {
  if (buses.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3 bg-green-50 border-l-4 border-green-500">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-green-600" />
        <h3 className="text-sm font-bold text-green-900">
          Bus Arrivés Récemment
        </h3>
        <span className="ml-auto px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
          {buses.length}
        </span>
      </div>

      <div className="space-y-2">
        {buses.map((bus) => (
          <div
            key={bus.id}
            onClick={() => onBusClick?.(bus.id)}
            className="bg-white rounded-lg p-3 border border-green-200 hover:border-green-400 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-700 font-bold text-sm">
                    {bus.number.replace('BUS-', '')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Bus {bus.number}
                  </p>
                  <p className="text-xs text-slate-600">
                    {bus.driver?.name || 'Sans chauffeur'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-green-600">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">
                  Arrivé
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-green-700 mt-2 italic">
        Ces bus passeront automatiquement à "Arrêté" après 15 minutes
      </p>
    </div>
  );
};

