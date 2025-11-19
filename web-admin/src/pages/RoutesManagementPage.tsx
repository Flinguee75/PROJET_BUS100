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

  // Mutation pour supprimer une route
  const deleteMutation = useMutation({
    mutationFn: routeApi.deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  const handleDelete = async (routeId: string, routeName: string) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la route "${routeName}" ?`
    );
    if (confirmDelete) {
      deleteMutation.mutate(routeId);
    }
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
                className="bg-white rounded-xl shadow-card border border-slate-200 p-6 hover:shadow-card-hover transition-all"
              >
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {route.name}
                    </h3>
                    <p className="text-sm text-slate-500">{route.code}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                      route.isActive
                        ? 'bg-success-50 text-success-700 border-success-200'
                        : 'bg-danger-50 text-danger-700 border-danger-200'
                    }`}
                  >
                    {route.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Commune et quartiers */}
                <div className="mb-4">
                  <div className="flex items-center text-sm text-slate-700 mb-2">
                    <MapPin className="w-4 h-4 mr-1 text-slate-500" strokeWidth={2} />
                    <span className="font-semibold">Commune:</span>
                    <span className="ml-2">
                      {route.commune || <span className="text-slate-400 italic">Non définie</span>}
                    </span>
                  </div>
                  <div className="flex items-start text-sm text-slate-700">
                    <Map className="w-4 h-4 mr-1 mt-0.5 text-slate-500 flex-shrink-0" strokeWidth={2} />
                    <span className="font-semibold">Quartiers:</span>
                    <span className="ml-2">
                      {route.quartiers && route.quartiers.length > 0 ? (
                        <>
                      {route.quartiers.slice(0, 3).join(', ')}
                      {route.quartiers.length > 3 && ` +${route.quartiers.length - 3}`}
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Aucun quartier</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-slate-500">Arrêts</span>
                    <p className="font-bold text-slate-900">{route.stops?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Distance</span>
                    <p className="font-bold text-slate-900">
                      {route.totalDistanceKm != null ? `${route.totalDistanceKm} km` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Durée</span>
                    <p className="font-bold text-slate-900">
                      {route.estimatedDurationMinutes != null ? `${route.estimatedDurationMinutes} min` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Occupation</span>
                    <p className="font-bold text-slate-900">
                      {route.currentOccupancy != null ? route.currentOccupancy : 0}/{route.capacity != null ? route.capacity : 0}
                    </p>
                  </div>
                </div>

                {/* Horaires */}
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-1 mb-2">
                    <Clock className="w-3.5 h-3.5 text-slate-600" strokeWidth={2} />
                    <p className="text-xs text-slate-700 font-semibold">Horaires</p>
                  </div>
                  <div className="text-sm text-slate-700">
                    {route.schedule ? (
                      <>
                    <div className="flex justify-between">
                      <span>Matin:</span>
                      <span className="font-semibold">
                            {route.schedule.morningDeparture || 'N/A'} → {route.schedule.morningArrival || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Après-midi:</span>
                      <span className="font-semibold">
                            {route.schedule.afternoonDeparture || 'N/A'} → {route.schedule.afternoonArrival || 'N/A'}
                      </span>
                    </div>
                      </>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Horaires non définis</span>
                    )}
                  </div>
                </div>

                {/* Assignations */}
                <div className="mb-4 space-y-2 text-sm">
                  {route.busId ? (
                    <div className="flex items-center text-primary-700">
                      <Bus className="w-4 h-4 mr-1.5" strokeWidth={2} />
                      <span>Bus: {route.busId.substring(0, 8)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-slate-500">
                      <Bus className="w-4 h-4 mr-1.5" strokeWidth={2} />
                      <span>Aucun bus assigné</span>
                    </div>
                  )}
                  {route.driverId ? (
                    <div className="flex items-center text-success-700">
                      <UserCog className="w-4 h-4 mr-1.5" strokeWidth={2} />
                      <span>Chauffeur: {route.driverId.substring(0, 8)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-slate-500">
                      <UserCog className="w-4 h-4 mr-1.5" strokeWidth={2} />
                      <span>Aucun chauffeur</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => alert('Fonction Modifier à implémenter')}
                    className="flex-1 flex items-center justify-center gap-1.5 text-primary-600 hover:bg-primary-50 font-medium text-sm py-2 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" strokeWidth={2} />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => handleDelete(route.id, route.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-danger-600 hover:bg-danger-50 font-medium text-sm py-2 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2} />
                    <span>Supprimer</span>
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
      </div>
    </div>
  );
};

