/**
 * Page de détails d'un bus
 * Affiche toutes les informations d'un bus spécifique
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import * as gpsApi from '@/services/gps.api';
import type { Bus } from '@/types/bus';

export const BusDetailsPage = () => {
  const { busId } = useParams<{ busId: string }>();

  // Récupérer les détails du bus
  const { data: bus, isLoading, error } = useQuery<Bus>({
    queryKey: ['bus', busId],
    queryFn: () => gpsApi.getBusDetails(busId!),
    enabled: !!busId,
  });

  if (isLoading) {
    return (
      <div className="flex-1">
        <Header title="Détails du Bus" />
        <div className="p-8 flex justify-center">
          <LoadingSpinner message="Chargement des détails..." />
        </div>
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="flex-1">
        <Header title="Détails du Bus" />
        <div className="p-8">
          <ErrorMessage message="Impossible de charger les détails du bus" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Bus Details" />

      <div className="p-8 space-y-6">
        {/* En-tête avec photo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start space-x-6">
            {/* Photo du bus */}
            <div className="relative">
              <img
                src={bus.photoUrl || '/bus-placeholder.jpg'}
                alt="Bus"
                className="w-48 h-32 object-cover rounded-lg"
              />
              <span className="absolute top-2 left-2 bg-white px-3 py-1 rounded-lg text-sm font-medium shadow">
                PHOTO BUS
              </span>
            </div>

            {/* Informations principales */}
            <div className="flex-1 grid grid-cols-4 gap-4">
              {/* Immatriculation */}
              <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">IMMATRICIILATION</p>
                <p className="text-xl font-bold text-gray-900">{bus.immatriculation}</p>
              </div>

              {/* Chauffeur */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">CHAUFFEUR</p>
                <p className="text-lg font-semibold text-blue-600">{bus.chauffeur}</p>
              </div>

              {/* Capacité */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">CAPAICITÉ</p>
                <p className="text-xl font-bold text-gray-900">{bus.capacite} Élèves</p>
              </div>

              {/* Itinéraire */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-1">ITINÉRAIRE</p>
                <p className="text-lg font-semibold text-blue-600">{bus.itineraire}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grille avec historique GPS et incidents */}
        <div className="grid grid-cols-3 gap-6">
          {/* Historique GPS */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">HISTORIQUE GPS</h3>

            <div className="relative">
              {/* Timeline */}
              <div className="flex items-center justify-between relative">
                {/* Ligne de connexion */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-blue-500"></div>

                {bus.gpsHistory?.map((point, index) => (
                  <div key={index} className="relative z-10 flex flex-col items-center">
                    {/* Icône de position */}
                    <div className="w-12 h-12 bg-white border-4 border-blue-500 rounded-full flex items-center justify-center mb-3">
                      <span className="text-blue-500 text-2xl">📍</span>
                    </div>

                    {/* Informations */}
                    <div className="text-center">
                      <p className="font-medium text-gray-900 text-sm">{point.time}</p>
                      <p className="text-xs text-gray-600 mt-1 max-w-[120px]">{point.location}</p>
                    </div>

                    {/* Indicateur spécial pour la position actuelle */}
                    {index === bus.gpsHistory!.length - 1 && (
                      <span className="mt-2 text-yellow-500 text-xl">⭐</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Incidents signalés */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">INCIDENTS SIGNALÉS</h3>

            <div className="space-y-3">
              {bus.incidents?.map((incident, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {/* Indicateur de couleur */}
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      incident.type === 'pneu_creve'
                        ? 'bg-red-500'
                        : incident.type === 'retard_imprevu'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  ></div>

                  {/* Texte */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{incident.label}</p>
                  </div>

                  {/* Icône de résolution */}
                  {incident.resolved && (
                    <span className="text-green-500 text-xl">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* État de maintenance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">ÉTAT MAINTENANCE</h3>

          {/* Barre de progression */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">{bus.maintenanceStatus}% OK</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${bus.maintenanceStatus}%` }}
              ></div>
            </div>
          </div>

          {/* Historique de maintenance */}
          <div className="space-y-3">
            {bus.maintenanceRecords?.map((record, index) => (
              <div key={index} className="flex items-start space-x-3">
                {/* Icône */}
                <span className="text-2xl mt-1">
                  {record.type === 'vidange'
                    ? '💧'
                    : record.type === 'controle_technique'
                    ? '🔧'
                    : '⚙️'}
                </span>

                {/* Texte */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{record.label}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    <span
                      className={`font-medium ${
                        record.status === 'scheduled'
                          ? 'text-blue-600'
                          : record.status === 'approved'
                          ? 'text-green-600'
                          : record.status === 'completed'
                          ? 'text-gray-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      ({record.statusLabel})
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

