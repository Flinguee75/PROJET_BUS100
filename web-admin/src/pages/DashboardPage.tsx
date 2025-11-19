/**
 * Page Dashboard - Vue d'ensemble du système (Design Professionnel)
 * Affiche les statistiques principales avec hiérarchie visuelle claire
 */

import { useQuery } from '@tanstack/react-query';
import { 
  Bus, 
  Users, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import * as gpsApi from '@/services/gps.api';
import type { DashboardStats } from '@/types/bus';

export const DashboardPage = () => {
  // Récupérer les statistiques
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: gpsApi.getDashboardStats,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Calculer le statut global du système
  const getSystemStatus = () => {
    if (!stats) return { label: 'Chargement...', color: 'slate', icon: Activity };
    
    const hasIssues = stats.busEnRetard > 0 || stats.alertesMaintenance > 0;
    const hasUrgentIssues = stats.alertesMaintenance > 0;
    
    if (hasUrgentIssues) {
      return { 
        label: 'Action requise', 
        color: 'danger',
        icon: AlertTriangle 
      };
    }
    
    if (hasIssues) {
      return { 
        label: 'Surveillance requise', 
        color: 'warning',
        icon: Clock 
      };
    }
    
    return { 
      label: 'Opérationnel', 
      color: 'success',
      icon: CheckCircle2 
    };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="flex-1 bg-neutral-50">
      <Header title="Tableau de bord" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {isLoading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner message="Chargement des statistiques..." />
          </div>
        )}

        {error && (
          <div className="py-8">
            <ErrorMessage message="Impossible de charger les statistiques" />
          </div>
        )}

        {stats && (
          <>
            {/* En-tête avec statut global */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1.5">
                    Vue d'ensemble
                  </p>
                  <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">
                    Performance du jour
                  </h1>
                </div>
                
                {/* Badge de statut global */}
                <div className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                  ${systemStatus.color === 'success' ? 'bg-success-50 text-success-700' : ''}
                  ${systemStatus.color === 'warning' ? 'bg-warning-50 text-warning-700' : ''}
                  ${systemStatus.color === 'danger' ? 'bg-danger-50 text-danger-700' : ''}
                  ${systemStatus.color === 'slate' ? 'bg-slate-100 text-slate-700' : ''}
                `}>
                  <systemStatus.icon className="w-4 h-4" strokeWidth={2.5} />
                  <span>{systemStatus.label}</span>
                </div>
              </div>

              {/* Ligne de séparation subtile */}
              <div className="h-px bg-slate-200"></div>
            </div>

            {/* Grille de statistiques principales - 4 colonnes sur grand écran */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              
              {/* Carte 1 - Bus actifs */}
              <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Bus className="w-6 h-6 text-primary-600" strokeWidth={2} />
                  </div>
                  
                  {stats.busActifs > 0 && (
                    <span className="px-2.5 py-1 bg-success-50 text-success-700 text-xs font-semibold rounded-md">
                      En ligne
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Bus actifs
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-bold text-slate-900 tracking-tight">
                      {stats.busActifs ?? 0}
                    </span>
                    <span className="text-lg font-medium text-slate-400">
                      / {stats.busTotaux ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Flotte totale
                  </p>
                </div>
              </div>

              {/* Carte 2 - Élèves transportés */}
              <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-700" strokeWidth={2} />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Élèves transportés
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-bold text-slate-900 tracking-tight">
                      {(stats.elevesTransportes ?? 0).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Aujourd'hui
                  </p>
                </div>
              </div>

              {/* Carte 3 - Bus en retard */}
              <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    stats.busEnRetard > 0 ? 'bg-warning-50' : 'bg-slate-100'
                  }`}>
                    <Clock className={`w-6 h-6 ${
                      stats.busEnRetard > 0 ? 'text-warning-600' : 'text-slate-600'
                    }`} strokeWidth={2} />
                  </div>
                  
                  {stats.busEnRetard > 0 && (
                    <span className="px-2.5 py-1 bg-warning-50 text-warning-700 text-xs font-semibold rounded-md">
                      Attention
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Bus en retard
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-4xl font-bold tracking-tight ${
                      stats.busEnRetard > 0 ? 'text-warning-600' : 'text-slate-900'
                    }`}>
                      {stats.busEnRetard ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Sur {stats.totalTrajets ?? 0} trajets actifs
                  </p>
                </div>
              </div>

              {/* Carte 4 - Alertes maintenance */}
              <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    stats.alertesMaintenance > 0 ? 'bg-danger-50' : 'bg-slate-100'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${
                      stats.alertesMaintenance > 0 ? 'text-danger-600' : 'text-slate-600'
                    }`} strokeWidth={2} />
                  </div>
                  
                  {stats.alertesMaintenance > 0 && (
                    <span className="px-2.5 py-1 bg-danger-50 text-danger-700 text-xs font-semibold rounded-md">
                      Urgent
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Alertes maintenance
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-4xl font-bold tracking-tight ${
                      stats.alertesMaintenance > 0 ? 'text-danger-600' : 'text-slate-900'
                    }`}>
                      {stats.alertesMaintenance ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {stats.alertesMaintenance > 0 ? 'À traiter rapidement' : 'Aucune alerte'}
                  </p>
                </div>
              </div>

            </div>

            {/* Section secondaire - Résumé du jour */}
            <div className="bg-white rounded-xl shadow-card p-6 border border-slate-200/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Résumé de l'activité
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Mis à jour il y a quelques instants
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Taux d'activité */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-slate-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Taux d'activité</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.busTotaux > 0 
                        ? Math.round((stats.busActifs / stats.busTotaux) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>

                {/* Statut ponctualité */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className={`w-5 h-5 ${
                      stats.busEnRetard === 0 ? 'text-success-600' : 'text-warning-600'
                    }`} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Ponctualité</p>
                    <p className={`text-2xl font-bold ${
                      stats.busEnRetard === 0 ? 'text-success-600' : 'text-warning-600'
                    }`}>
                      {stats.busEnRetard === 0 ? 'Excellente' : 'À surveiller'}
                    </p>
                  </div>
                </div>

                {/* Statut maintenance */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className={`w-5 h-5 ${
                      stats.alertesMaintenance === 0 ? 'text-success-600' : 'text-danger-600'
                    }`} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Maintenance</p>
                    <p className={`text-2xl font-bold ${
                      stats.alertesMaintenance === 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {stats.alertesMaintenance === 0 ? 'À jour' : `${stats.alertesMaintenance} alerte${stats.alertesMaintenance > 1 ? 's' : ''}`}
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
