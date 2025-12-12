/**
 * Page de Gestion des Routes Géographiques
 * Interface CRUD complète pour les routes d'Abidjan
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Edit2, Trash2, MapPin, Map, Bus, UserCog, Clock, X } from 'lucide-react';
import * as routeApi from '@/services/route.api';

export const RoutesManagementPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommune, setSelectedCommune] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<routeApi.Route | null>(null);

  // Récupérer les routes
  const {
    data: routes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['routes'],
    queryFn: routeApi.getAllRoutes,
  });

  // Récupérer les communes
  const { data: communes } = useQuery({
    queryKey: ['communes'],
    queryFn: routeApi.getCommunes,
  });

  const handleViewDetails = (route: routeApi.Route) => {
    setSelectedRoute(route);
  };

  const handleCloseDetails = () => {
    setSelectedRoute(null);
  };

  // Filtrer les routes par commune
  const filteredRoutes = selectedCommune
    ? routes?.filter((r) => r.commune === selectedCommune)
    : routes;

  return (
    <div className="flex-1 bg-neutral-50">
      <Header title="Gestion des Routes" subtitle="Gérer les parcours de bus dans Abidjan" />

      <div className="p-8">
        {/* En-tête */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Parcours de Bus
            </h2>
            <p className="text-slate-600 mt-1">
              {routes?.length || 0} route(s) configurée(s)
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Créer une route</span>
          </button>
        </div>

        {/* Filtre par commune */}
        <div className="mb-6 bg-white rounded-xl shadow-card border border-slate-200 p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
            <Map className="w-4 h-4" strokeWidth={2} />
            <span>Filtrer par commune</span>
          </label>
          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          >
            <option value="">Toutes les communes</option>
            {communes?.map((commune) => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Chargement des routes..." />
          </div>
        )}

        {error && <ErrorMessage message="Impossible de charger les routes" />}

        {!isLoading && !error && filteredRoutes && filteredRoutes.length === 0 && (
          <EmptyState
            icon={Map}
            title="Aucune route configurée"
            description={selectedCommune ? `Aucune route pour la commune "${selectedCommune}"` : "Utilisez le bouton 'Créer une route' ci-dessus pour commencer"}
          />
        )}

        {!isLoading && !error && filteredRoutes && filteredRoutes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all overflow-hidden"
              >
                {/* 1. ZONE DESSERVIE - EN PREMIER */}
                <div className="border-b border-slate-200 px-6 py-4 bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Map className="w-5 h-5 text-slate-600" strokeWidth={2} />
                      <h3 className="text-sm font-semibold text-slate-700">
                        Zone desservie
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                        route.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {route.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {route.quartiers && route.quartiers.length > 0 ? (
                      route.quartiers.map((quartier, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-white text-slate-700 text-sm font-medium rounded-md border border-slate-200"
                        >
                          {quartier}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-sm">Aucun quartier configuré</span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {/* 2. BUS ASSIGNÉ */}
                  <div className="mb-4 p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bus className="w-6 h-6 text-slate-600" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500 mb-1">Bus assigné</p>
                        {route.busId ? (
                          <p className="text-xl font-bold text-slate-900">{route.code || route.busId.substring(0, 8)}</p>
                        ) : (
                          <p className="text-base font-medium text-slate-400 italic">Non assigné</p>
                        )}
                      </div>
                      {!route.busId && (
                        <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md">
                          <span className="text-xs font-medium text-amber-700">À assigner</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. NOMBRE D'ÉLÈVES INSCRITS */}
                  <div className="mb-4 p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Élèves inscrits</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {route.currentOccupancy != null ? route.currentOccupancy : 0}
                          <span className="text-lg text-slate-400 font-medium"> / {route.capacity || 0}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-16 rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
                          <span className="text-xl font-bold text-slate-700">
                            {route.capacity > 0
                              ? Math.round(((route.currentOccupancy || 0) / route.capacity) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 transition-all"
                        style={{
                          width: `${route.capacity > 0
                            ? Math.min(((route.currentOccupancy || 0) / route.capacity) * 100, 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* 4. CHAUFFEUR ET HORAIRES */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {/* Chauffeur */}
                    <div className="p-3 border border-slate-200 rounded-lg bg-white">
                      <div className="flex items-center gap-2 mb-1.5">
                        <UserCog className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <p className="text-xs font-medium text-slate-500">Chauffeur</p>
                      </div>
                      {route.driverId ? (
                        <p className="text-sm font-semibold text-slate-900">{route.driverId.substring(0, 12)}</p>
                      ) : (
                        <p className="text-sm font-medium text-slate-400 italic">Non assigné</p>
                      )}
                    </div>

                    {/* Horaires */}
                    <div className="p-3 border border-slate-200 rounded-lg bg-white">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock className="w-4 h-4 text-slate-500" strokeWidth={2} />
                        <p className="text-xs font-medium text-slate-500">Horaire matin</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {route.schedule?.morningDeparture || '--'} → {route.schedule?.morningArrival || '--'}
                      </p>
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div>
                        <MapPin className="w-4 h-4 mx-auto mb-1 text-slate-400" strokeWidth={2} />
                        <p className="font-semibold text-slate-900">{route.stops?.length || 0}</p>
                        <p className="text-slate-500">Arrêts</p>
                      </div>
                      <div>
                        <Map className="w-4 h-4 mx-auto mb-1 text-slate-400" strokeWidth={2} />
                        <p className="font-semibold text-slate-900">
                          {route.totalDistanceKm != null ? route.totalDistanceKm : '--'}
                        </p>
                        <p className="text-slate-500">km</p>
                      </div>
                      <div>
                        <Clock className="w-4 h-4 mx-auto mb-1 text-slate-400" strokeWidth={2} />
                        <p className="font-semibold text-slate-900">
                          {route.estimatedDurationMinutes != null ? route.estimatedDurationMinutes : '--'}
                        </p>
                        <p className="text-slate-500">min</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleViewDetails(route)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 font-medium text-sm py-3 rounded-md transition-colors"
                  >
                    <MapPin className="w-4 h-4" strokeWidth={2} />
                    <span>Voir Détail</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de création (simplifié) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  Créer une nouvelle route
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                  type="button"
                >
                  <X className="w-5 h-5 text-slate-500" strokeWidth={2} />
                </button>
              </div>
              <p className="text-slate-600 mb-6">
                Fonctionnalité complète à venir. Utilisez l'API directement pour créer
                des routes pour le moment.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-all font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de détails */}
        {selectedRoute && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Détails de la zone</h3>
                  <p className="text-sm text-slate-500 mt-1">Informations complètes sur cette route</p>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  type="button"
                >
                  <X className="w-5 h-5 text-slate-500" strokeWidth={2} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Zone desservie */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Map className="w-5 h-5 text-slate-600" strokeWidth={2} />
                    Zone desservie
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoute.quartiers && selectedRoute.quartiers.length > 0 ? (
                      selectedRoute.quartiers.map((quartier, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                        >
                          {quartier}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">Aucun quartier configuré</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Commune: <span className="font-semibold">{selectedRoute.commune}</span>
                  </p>
                </div>

                {/* Informations générales */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-1">Code de la route</p>
                    <p className="text-lg font-bold text-slate-900">{selectedRoute.code}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-1">Nom de la route</p>
                    <p className="text-lg font-bold text-slate-900">{selectedRoute.name}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-1">Statut</p>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-md ${
                        selectedRoute.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {selectedRoute.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-1">Jours actifs</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedRoute.activeDays && selectedRoute.activeDays.length > 0
                        ? selectedRoute.activeDays.join(', ')
                        : 'Non défini'}
                    </p>
                  </div>
                </div>

                {/* Transport */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-slate-600" strokeWidth={2} />
                    Transport
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">Bus assigné</p>
                      <p className="text-base font-bold text-slate-900">
                        {selectedRoute.busId || <span className="text-slate-400 italic">Non assigné</span>}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">Chauffeur</p>
                      <p className="text-base font-bold text-slate-900">
                        {selectedRoute.driverId || <span className="text-slate-400 italic">Non assigné</span>}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">Capacité totale</p>
                      <p className="text-2xl font-bold text-slate-900">{selectedRoute.capacity}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">Élèves inscrits</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedRoute.currentOccupancy}
                        <span className="text-sm text-slate-400 font-medium ml-1">
                          ({selectedRoute.capacity > 0
                            ? Math.round((selectedRoute.currentOccupancy / selectedRoute.capacity) * 100)
                            : 0}%)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Horaires */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-600" strokeWidth={2} />
                    Horaires
                  </h4>
                  {selectedRoute.schedule ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-2">Matin</p>
                        <p className="text-sm font-semibold text-slate-900">
                          Départ: {selectedRoute.schedule.morningDeparture || '--'}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          Arrivée: {selectedRoute.schedule.morningArrival || '--'}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-2">Après-midi</p>
                        <p className="text-sm font-semibold text-slate-900">
                          Départ: {selectedRoute.schedule.afternoonDeparture || '--'}
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          Arrivée: {selectedRoute.schedule.afternoonArrival || '--'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Horaires non définis</p>
                  )}
                </div>

                {/* Parcours */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-600" strokeWidth={2} />
                    Parcours
                  </h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      <p className="text-xs font-medium text-slate-500 mb-1">Nombre d'arrêts</p>
                      <p className="text-2xl font-bold text-slate-900">{selectedRoute.stops?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      <p className="text-xs font-medium text-slate-500 mb-1">Distance totale</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedRoute.totalDistanceKm != null ? selectedRoute.totalDistanceKm : '--'}
                        <span className="text-sm font-medium text-slate-500 ml-1">km</span>
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                      <p className="text-xs font-medium text-slate-500 mb-1">Durée estimée</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedRoute.estimatedDurationMinutes != null ? selectedRoute.estimatedDurationMinutes : '--'}
                        <span className="text-sm font-medium text-slate-500 ml-1">min</span>
                      </p>
                    </div>
                  </div>

                  {/* Liste des arrêts */}
                  {selectedRoute.stops && selectedRoute.stops.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700 mb-2">Liste des arrêts</p>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {selectedRoute.stops
                          .sort((a, b) => a.order - b.order)
                          .map((stop, idx) => (
                            <div
                              key={stop.id}
                              className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3"
                            >
                              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-slate-600">{idx + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900">{stop.name}</p>
                                <p className="text-xs text-slate-500">{stop.address}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Quartier: {stop.quartier} • Type: {stop.type === 'pickup' ? 'Ramassage' : stop.type === 'dropoff' ? 'Dépose' : 'Ramassage & Dépose'}
                                </p>
                                {stop.notes && (
                                  <p className="text-xs text-slate-500 italic mt-1">Note: {stop.notes}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-slate-500">Temps estimé</p>
                                <p className="text-sm font-semibold text-slate-900">{stop.estimatedTimeMinutes} min</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-sm">Aucun arrêt configuré</p>
                  )}
                </div>

                {/* Description */}
                {selectedRoute.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      {selectedRoute.description}
                    </p>
                  </div>
                )}

                {/* Métadonnées */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                    <div>
                      <p>Créé le: <span className="font-semibold">{new Date(selectedRoute.createdAt).toLocaleDateString('fr-FR')}</span></p>
                    </div>
                    <div>
                      <p>Dernière modification: <span className="font-semibold">{new Date(selectedRoute.updatedAt).toLocaleDateString('fr-FR')}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4">
                <button
                  onClick={handleCloseDetails}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 font-medium py-3 rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

