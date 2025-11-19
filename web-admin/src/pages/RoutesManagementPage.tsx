/**
 * Page de Gestion des Routes Géographiques
 * Interface CRUD complète pour les routes d'Abidjan
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
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
    <div className="flex-1 bg-gray-50">
      <Header title="Gestion des Routes" />

      <div className="p-8">
        {/* En-tête */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Parcours de Bus
            </h2>
            <p className="text-gray-600 mt-1">
              {routes?.length || 0} route(s) configurée(s)
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            + Créer une route
          </button>
        </div>

        {/* Filtre par commune */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrer par commune
          </label>
          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">Aucune route configurée</p>
            <p className="text-gray-400 mt-2">
              Cliquez sur "Créer une route" pour commencer
            </p>
          </div>
        )}

        {!isLoading && !error && filteredRoutes && filteredRoutes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                {/* En-tête */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {route.name}
                    </h3>
                    <p className="text-sm text-gray-500">{route.code}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      route.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {route.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Commune et quartiers */}
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <span className="font-medium">📍 Commune:</span>
                    <span className="ml-2">{route.commune}</span>
                  </div>
                  <div className="flex items-start text-sm text-gray-700">
                    <span className="font-medium">🏘️ Quartiers:</span>
                    <span className="ml-2">
                      {route.quartiers.slice(0, 3).join(', ')}
                      {route.quartiers.length > 3 && ` +${route.quartiers.length - 3}`}
                    </span>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Arrêts</span>
                    <p className="font-semibold text-gray-900">{route.stops.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Distance</span>
                    <p className="font-semibold text-gray-900">
                      {route.totalDistanceKm} km
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Durée</span>
                    <p className="font-semibold text-gray-900">
                      {route.estimatedDurationMinutes} min
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Occupation</span>
                    <p className="font-semibold text-gray-900">
                      {route.currentOccupancy}/{route.capacity}
                    </p>
                  </div>
                </div>

                {/* Horaires */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Horaires</p>
                  <div className="text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Matin:</span>
                      <span className="font-medium">
                        {route.schedule.morningDeparture} → {route.schedule.morningArrival}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Après-midi:</span>
                      <span className="font-medium">
                        {route.schedule.afternoonDeparture} → {route.schedule.afternoonArrival}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assignations */}
                <div className="mb-4 space-y-2 text-sm">
                  {route.busId ? (
                    <div className="flex items-center text-blue-700">
                      <span>🚌 Bus assigné: {route.busId.substring(0, 8)}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">🚌 Aucun bus assigné</div>
                  )}
                  {route.driverId ? (
                    <div className="flex items-center text-green-700">
                      <span>👤 Chauffeur: {route.driverId.substring(0, 8)}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">👤 Aucun chauffeur</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => alert('Fonction Modifier à implémenter')}
                    className="flex-1 text-blue-600 hover:text-blue-800 font-medium text-sm py-2"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(route.id, route.name)}
                    className="flex-1 text-red-600 hover:text-red-800 font-medium text-sm py-2"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de création (simplifié) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Créer une nouvelle route
              </h3>
              <p className="text-gray-600 mb-6">
                Fonctionnalité complète à venir. Utilisez l'API directement pour créer
                des routes pour le moment.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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

