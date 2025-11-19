/**
 * Page Dashboard - Vue d'ensemble du système
 * Affiche les statistiques principales et les widgets
 */

import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useRealtimeStatistics } from '@/hooks/useRealtimeBuses';
import type { DashboardStats } from '@/types/bus';

export const DashboardPage = () => {
  // Récupérer les statistiques en temps réel via Firestore
  const { stats: realtimeStats, isLoading, error } = useRealtimeStatistics();

  // Mapper les statistiques temps réel vers le format DashboardStats
  const stats: DashboardStats | null = realtimeStats
    ? {
        busActifs: realtimeStats.active,
        busTotaux: realtimeStats.total,
        elevesTransportes: realtimeStats.totalPassengers,
        busEnRetard: realtimeStats.delayed,
        totalTrajets: realtimeStats.enRoute,
        alertesMaintenance: 0, // À implémenter plus tard
      }
    : null;

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Tableau de bord" />

      <div className="p-8">
        {/* Indicateur temps réel */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Données mises à jour en temps réel</span>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Chargement des statistiques..." />
          </div>
        )}

        {error && (
          <ErrorMessage message="Impossible de charger les statistiques" />
        )}

        {stats && (
          <>
            {/* Statistiques principales - Style des maquettes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Bus actifs */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🚌</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      Nombre de bus actifs
                    </p>
                    <p className="text-4xl font-bold text-blue-600 mb-1">
                      {stats.busActifs ?? 0}
                    </p>
                    <p className="text-gray-500 text-sm">
                      En ligne / {stats.busTotaux ?? 0} Total
                    </p>
                  </div>
                </div>
              </div>

              {/* Élèves transportés */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      Nombre d'élèves transportés
                    </p>
                    <p className="text-4xl font-bold text-yellow-600 mb-1">
                      {(stats.elevesTransportes ?? 0).toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">Aujourd'hui</p>
                  </div>
                </div>
              </div>

              {/* Bus en retard */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🕐</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      Bus en retard
                    </p>
                    <p className="text-4xl font-bold text-blue-600 mb-1">
                      {stats.busEnRetard ?? 0}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Bus sur {stats.totalTrajets ?? 0} trajets
                    </p>
                  </div>
                </div>
              </div>

              {/* Alertes maintenance */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-1">
                      Alertes maintenance
                    </p>
                    <p className="text-4xl font-bold text-yellow-600 mb-1">
                      {stats.alertesMaintenance ?? 0}
                    </p>
                    <p className="text-gray-500 text-sm">
                      À traiter urgemment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
