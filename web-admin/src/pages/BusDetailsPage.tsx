/**
 * Page de détails d'un bus (Design Professionnel)
 * Affiche toutes les informations d'un bus spécifique
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bus as BusIcon,
  User,
  Users,
  Route as RouteIcon,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Calendar,
  Activity
} from 'lucide-react';
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
      <div className="flex-1 bg-neutral-50">
        <Header title="Détails du Bus" />
        <div className="p-8 flex justify-center">
          <LoadingSpinner message="Chargement des détails..." />
        </div>
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="flex-1 bg-neutral-50">
        <Header title="Détails du Bus" />
        <div className="p-8">
          <ErrorMessage message="Impossible de charger les détails du bus" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-50">
      <Header title={`Bus ${bus.immatriculation}`} subtitle="Informations détaillées" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Carte principale - Informations */}
        <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
          <div className="flex items-start gap-6">
            {/* Photo du bus */}
            <div className="relative flex-shrink-0">
              <div className="w-48 h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                {bus.photoUrl ? (
                  <img
                    src={bus.photoUrl}
                    alt="Bus"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BusIcon className="w-16 h-16 text-slate-300" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <span className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm border border-slate-200">
                PHOTO BUS
              </span>
            </div>

            {/* Informations principales */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Immatriculation */}
              <div className="border-l-4 border-primary-500 bg-primary-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-primary-700 mb-1 uppercase tracking-wide">
                  Immatriculation
                </p>
                <p className="text-xl font-bold text-slate-900">{bus.immatriculation}</p>
              </div>

              {/* Chauffeur */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-500" strokeWidth={2} />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Chauffeur
                  </p>
                </div>
                <p className="text-lg font-bold text-primary-600">{bus.chauffeur}</p>
              </div>

              {/* Capacité */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" strokeWidth={2} />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Capacité
                  </p>
                </div>
                <p className="text-xl font-bold text-slate-900">{bus.capacite} <span className="text-sm font-normal text-slate-600">élèves</span></p>
              </div>

              {/* Itinéraire */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <RouteIcon className="w-3.5 h-3.5 text-slate-500" strokeWidth={2} />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Itinéraire
                  </p>
                </div>
                <p className="text-lg font-bold text-primary-600">{bus.itineraire}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grille avec historique GPS et incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Historique GPS */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-primary-600" strokeWidth={2} />
              <h3 className="text-lg font-bold text-slate-900 font-display">Historique GPS</h3>
            </div>

            {bus.gpsHistory && bus.gpsHistory.length > 0 ? (
              <div className="relative">
                {/* Timeline */}
                <div className="flex items-center justify-between relative">
                  {/* Ligne de connexion */}
                  <div className="absolute top-6 left-0 right-0 h-1 bg-primary-500"></div>

                  {bus.gpsHistory.map((point, index) => (
                    <div key={index} className="relative z-10 flex flex-col items-center">
                      {/* Icône de position */}
                      <div className="w-12 h-12 bg-white border-4 border-primary-500 rounded-full flex items-center justify-center mb-3 shadow-md">
                        <MapPin className="w-5 h-5 text-primary-600" strokeWidth={2.5} />
                      </div>

                      {/* Informations */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center mb-1">
                          <Clock className="w-3 h-3 text-slate-500" strokeWidth={2} />
                          <p className="font-semibold text-slate-900 text-sm">{point.time}</p>
                        </div>
                        <p className="text-xs text-slate-600 max-w-[120px]">{point.location}</p>
                      </div>

                      {/* Indicateur spécial pour la position actuelle */}
                      {index === bus.gpsHistory!.length - 1 && (
                        <div className="mt-2 w-5 h-5 bg-warning-100 rounded-full flex items-center justify-center">
                          <Activity className="w-3 h-3 text-warning-600" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">Aucun historique GPS disponible</p>
            )}
          </div>

          {/* Incidents signalés */}
          <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-warning-600" strokeWidth={2} />
              <h3 className="text-lg font-bold text-slate-900 font-display">Incidents</h3>
            </div>

            {bus.incidents && bus.incidents.length > 0 ? (
              <div className="space-y-3">
                {bus.incidents.map((incident, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {/* Indicateur de couleur */}
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        incident.type === 'pneu_creve'
                          ? 'bg-danger-500'
                          : incident.type === 'retard_imprevu'
                          ? 'bg-warning-500'
                          : 'bg-success-500'
                      }`}
                    ></div>

                    {/* Texte */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{incident.label}</p>
                    </div>

                    {/* Icône de résolution */}
                    {incident.resolved && (
                      <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0" strokeWidth={2} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">Aucun incident signalé</p>
            )}
          </div>
        </div>

        {/* État de maintenance */}
        <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Wrench className="w-5 h-5 text-primary-600" strokeWidth={2} />
            <h3 className="text-lg font-bold text-slate-900 font-display">État Maintenance</h3>
          </div>

          {/* Barre de progression */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl font-bold text-slate-900">{bus.maintenanceStatus}% <span className="text-base font-normal text-success-600">OK</span></span>
              <span className={`px-3 py-1 rounded-md text-xs font-semibold ${
                bus.maintenanceStatus >= 80 
                  ? 'bg-success-50 text-success-700 border border-success-200' 
                  : bus.maintenanceStatus >= 50
                  ? 'bg-warning-50 text-warning-700 border border-warning-200'
                  : 'bg-danger-50 text-danger-700 border border-danger-200'
              }`}>
                {bus.maintenanceStatus >= 80 ? 'Excellent' : bus.maintenanceStatus >= 50 ? 'Moyen' : 'Critique'}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  bus.maintenanceStatus >= 80 
                    ? 'bg-success-500' 
                    : bus.maintenanceStatus >= 50
                    ? 'bg-warning-500'
                    : 'bg-danger-500'
                }`}
                style={{ width: `${bus.maintenanceStatus}%` }}
              ></div>
            </div>
          </div>

          {/* Historique de maintenance */}
          {bus.maintenanceRecords && bus.maintenanceRecords.length > 0 ? (
            <div className="space-y-3">
              {bus.maintenanceRecords.map((record, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  {/* Icône */}
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-200">
                    {record.type === 'vidange' ? (
                      <Wrench className="w-5 h-5 text-primary-600" strokeWidth={2} />
                    ) : record.type === 'controle_technique' ? (
                      <CheckCircle2 className="w-5 h-5 text-success-600" strokeWidth={2} />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-warning-600" strokeWidth={2} />
                    )}
                  </div>

                  {/* Texte */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 mb-1">{record.label}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                      <p className="text-xs text-slate-600">
                        <span
                          className={`font-semibold ${
                            record.status === 'scheduled'
                              ? 'text-primary-600'
                              : record.status === 'approved'
                              ? 'text-success-600'
                              : record.status === 'completed'
                              ? 'text-slate-600'
                              : 'text-warning-600'
                          }`}
                        >
                          {record.statusLabel}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">Aucun historique de maintenance</p>
          )}
        </div>
      </div>
    </div>
  );
};
