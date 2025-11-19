/**
 * Page Dashboard - Vue OPÉRATIONNELLE (Contexte Abidjan)
 * Affiche les KPIs critiques pour la gestion du jour
 * Focus: État du service, retards critiques, validation sécurité
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Navigation,
  Gauge,
  Settings,
  AlertOctagon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import * as gpsApi from '@/services/gps.api';
import type { DashboardStats, Bus as BusType } from '@/types/bus';

export const DashboardPage = () => {
  const [showDelayedBuses, setShowDelayedBuses] = useState(false);
  const [showMaintenanceBuses, setShowMaintenanceBuses] = useState(false);

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

  // Récupérer la liste de tous les bus
  const {
    data: buses,
    isLoading: busesLoading,
  } = useQuery<BusType[]>({
    queryKey: ['all-buses'],
    queryFn: gpsApi.getAllBuses,
    refetchInterval: 30000,
  });

  // Filtrer les bus en retard et ceux en maintenance
  const delayedBuses = buses?.filter(bus => bus.status === 'EN_RETARD') || [];
  const maintenanceBuses = buses?.filter(bus => bus.maintenanceStatus < 70 || bus.status === 'HORS_SERVICE') || [];

  // Calculer le statut global du système (Focus: Opérationnel > Financier)
  const getSystemStatus = () => {
    if (!stats) return { label: 'Chargement...', color: 'slate', icon: Activity };
    
    // Priorité 1: Bus immobilisés (crise - pas de service)
    if (stats.busImmobilises && stats.busImmobilises > 0) {
      return { 
        label: 'Crise Opérationnelle', 
        color: 'danger',
        icon: AlertOctagon 
      };
    }
    
    // Priorité 2: Retards graves (>20 min) - impact fort sur les écoles
    if (stats.retardsGraves && stats.retardsGraves > 0) {
      return { 
        label: 'Retards Critiques', 
        color: 'danger',
        icon: AlertTriangle 
      };
    }
    
    // Priorité 3: Retards critiques (>15min)
    if (stats.retardsCritiques && stats.retardsCritiques > 0) {
      return { 
        label: 'Surveillance Requise', 
        color: 'warning',
        icon: Clock 
      };
    }
    
    // Priorité 4: Maintenance préventive
    if (stats.alertesMaintenance > 0) {
      return { 
        label: 'Maintenance à Prévoir', 
        color: 'warning',
        icon: Settings 
      };
    }
    
    return { 
      label: 'Service Opérationnel', 
      color: 'success',
      icon: CheckCircle2 
    };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="flex-1 bg-neutral-50">
      <Header title="Tableau de bord" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner message="Chargement des statistiques..." />
            <p className="text-sm text-slate-500 mt-4">Récupération des données en temps réel...</p>
          </div>
        )}

        {error && (
          <div className="py-8">
            <ErrorMessage message="Impossible de charger les statistiques" />
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">💡 <strong>Astuce :</strong> Assurez-vous que :</p>
              <ul className="text-xs text-blue-700 list-disc list-inside space-y-1 ml-4">
                <li>Le backend est démarré : <code className="bg-blue-100 px-1 py-0.5 rounded">npm run serve</code></li>
                <li>Des données mockées existent : <code className="bg-blue-100 px-1 py-0.5 rounded">npm run seed</code></li>
                <li>L'API est accessible sur le bon port</li>
              </ul>
            </div>
          </div>
        )}

        {stats && stats.busTotaux === 0 && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune donnée disponible</h3>
              <p className="text-slate-600 mb-6">
                Le système n'a pas encore de données. Commencez par créer des données mockées pour tester le Dashboard.
              </p>
              <div className="bg-white rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-slate-800 mb-3">🚀 Pour commencer :</p>
                <ol className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-600">1.</span>
                    <span>Ouvrez un terminal dans le dossier <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">backend/</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-600">2.</span>
                    <span>Exécutez : <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">npm run seed</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-600">3.</span>
                    <span>Rechargez cette page (F5)</span>
                  </li>
                </ol>
              </div>
              <p className="text-xs text-slate-500 mt-4">
                💡 Le script créera 8 bus, 100 élèves, des scans et des positions GPS avec retards simulés.
              </p>
            </div>
          </div>
        )}

        {stats && stats.busTotaux > 0 && (
          <>
            {/* En-tête avec statut global OPÉRATIONNEL */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1.5">
                    📍 État en temps réel • {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">
                    Opérations du Jour
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5">
                    Est-ce que tous les élèves vont arriver à l'heure ? Y a-t-il un bus en difficulté ?
                  </p>
                </div>
                
                {/* Badge de statut global */}
                <div className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm
                  ${systemStatus.color === 'success' ? 'bg-success-50 text-success-700 border border-success-200' : ''}
                  ${systemStatus.color === 'warning' ? 'bg-warning-50 text-warning-700 border border-warning-200' : ''}
                  ${systemStatus.color === 'danger' ? 'bg-danger-50 text-danger-700 border border-danger-200 animate-pulse' : ''}
                  ${systemStatus.color === 'slate' ? 'bg-slate-100 text-slate-700' : ''}
                `}>
                  <systemStatus.icon className="w-4 h-4" strokeWidth={2.5} />
                  <span>{systemStatus.label}</span>
                </div>
              </div>

              {/* Ligne de séparation subtile */}
              <div className="h-px bg-slate-200"></div>
            </div>

            {/* KPIs OPÉRATIONNELS - 3 colonnes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-8">
              
              {/* CARTE 1 - ÉTAT DU SERVICE (Remplace "Bus actifs") */}
              <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-primary-600" strokeWidth={2} />
                  </div>
                  
                  {(stats.busEnRoute ?? 0) > 0 && (
                    <span className="px-2.5 py-1 bg-success-50 text-success-700 text-xs font-semibold rounded-md">
                      En direct
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-3">
                    État du Service
                  </p>
                  
                  {/* Détail des états */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                        En route
                    </span>
                      <span className="font-semibold text-slate-900">
                        {stats.busEnRoute ?? 0}
                    </span>
                  </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Arrivés
                      </span>
                      <span className="font-semibold text-slate-900">
                        {stats.busArrives ?? 0}
                      </span>
                </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        Non partis
                      </span>
                      <span className="font-semibold text-slate-900">
                        {stats.busNonPartis ?? 0}
                      </span>
                  </div>
                </div>
                
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5" />
                      {stats.busActifs ?? 0} / {stats.busTotaux ?? 0} bus actifs
                    </p>
                  </div>
                </div>
              </div>

              {/* CARTE 2 - RETARDS CRITIQUES (>15min) avec seuil rouge si >20min */}
              <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    (stats.retardsGraves ?? 0) > 0 ? 'bg-danger-50' : 
                    (stats.retardsCritiques ?? 0) > 0 ? 'bg-warning-50' : 'bg-success-50'
                  }`}>
                    <Clock className={`w-6 h-6 ${
                      (stats.retardsGraves ?? 0) > 0 ? 'text-danger-600' : 
                      (stats.retardsCritiques ?? 0) > 0 ? 'text-warning-600' : 'text-success-600'
                    }`} strokeWidth={2} />
                  </div>
                  
                  {(stats.retardsGraves ?? 0) > 0 && (
                    <span className="px-2.5 py-1 bg-danger-50 text-danger-700 text-xs font-semibold rounded-md animate-pulse">
                      🚨 Urgent
                    </span>
                  )}
                  {(stats.retardsGraves ?? 0) === 0 && (stats.retardsCritiques ?? 0) > 0 && (
                    <span className="px-2.5 py-1 bg-warning-50 text-warning-700 text-xs font-semibold rounded-md">
                      ⚠️ Attention
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Retards Critiques
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-4xl font-bold tracking-tight ${
                      (stats.retardsGraves ?? 0) > 0 ? 'text-danger-600' : 
                      (stats.retardsCritiques ?? 0) > 0 ? 'text-warning-600' : 'text-success-600'
                    }`}>
                      {stats.retardsCritiques ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {(stats.retardsGraves ?? 0) > 0 
                      ? `${stats.retardsGraves} retard${stats.retardsGraves > 1 ? 's' : ''} > 20 min 🔴`
                      : (stats.retardsCritiques ?? 0) > 0 
                        ? '> 15 minutes de retard'
                        : 'Aucun retard significatif ✓'
                    }
                  </p>
                </div>
              </div>

              {/* CARTE 3 - TAUX DE VALIDATION (Scan) - Remplace "Élèves transportés" */}
              <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    (stats.tauxValidation ?? 0) >= 95 ? 'bg-success-50' : 
                    (stats.tauxValidation ?? 0) >= 85 ? 'bg-warning-50' : 'bg-danger-50'
                  }`}>
                    <ShieldCheck className={`w-6 h-6 ${
                      (stats.tauxValidation ?? 0) >= 95 ? 'text-success-600' : 
                      (stats.tauxValidation ?? 0) >= 85 ? 'text-warning-600' : 'text-danger-600'
                    }`} strokeWidth={2} />
                  </div>
                  
                  {(stats.tauxValidation ?? 0) >= 95 && (
                    <span className="px-2.5 py-1 bg-success-50 text-success-700 text-xs font-semibold rounded-md">
                      ✓ Sécurisé
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Validation Sécurité
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-4xl font-bold tracking-tight ${
                      (stats.tauxValidation ?? 0) >= 95 ? 'text-success-600' : 
                      (stats.tauxValidation ?? 0) >= 85 ? 'text-warning-600' : 'text-danger-600'
                    }`}>
                      {stats.tauxValidation ?? 0}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {(stats.elevesNonScannes ?? 0) > 0 
                      ? `${stats.elevesNonScannes} élève${stats.elevesNonScannes > 1 ? 's' : ''} non scanné${stats.elevesNonScannes > 1 ? 's' : ''}`
                      : `${stats.elevesTransportes ?? 0} élèves scannés ✓`
                    }
                  </p>
                </div>
              </div>

            </div>

            {/* Section secondaire - Métriques Opérationnelles Secondaires */}
            <div className="bg-white rounded-xl shadow-card p-6 border border-slate-200/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  📊 Métriques de Performance
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  ⏱️ Mis à jour en temps réel
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* NOUVEAU - Trafic vs Prévision */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Gauge className={`w-5 h-5 ${
                      (stats.tempsTrajetMoyen ?? 0) <= (stats.tempsTrajetPrevu ?? 0) 
                        ? 'text-success-600' 
                        : (stats.tempsTrajetMoyen ?? 0) <= (stats.tempsTrajetPrevu ?? 0) * 1.2
                          ? 'text-warning-600'
                          : 'text-danger-600'
                    }`} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Trafic vs Prévision</p>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-2xl font-bold ${
                        (stats.tempsTrajetMoyen ?? 0) <= (stats.tempsTrajetPrevu ?? 0) 
                          ? 'text-success-600' 
                          : (stats.tempsTrajetMoyen ?? 0) <= (stats.tempsTrajetPrevu ?? 0) * 1.2
                            ? 'text-warning-600'
                            : 'text-danger-600'
                      }`}>
                        {stats.tempsTrajetMoyen ?? 0} min
                      </p>
                      <span className="text-xs text-slate-500">
                        / {stats.tempsTrajetPrevu ?? 0} min prévu
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(stats.tempsTrajetMoyen ?? 0) <= (stats.tempsTrajetPrevu ?? 0)
                        ? '✓ Circulation fluide'
                        : `+${Math.round(((stats.tempsTrajetMoyen ?? 0) / (stats.tempsTrajetPrevu || 1) - 1) * 100)}% de retard`
                      }
                    </p>
                  </div>
                </div>

                {/* NOUVEAU - Disponibilité Flotte */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bus className={`w-5 h-5 ${
                      (stats.busImmobilises ?? 0) === 0 ? 'text-success-600' : 'text-danger-600'
                    }`} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Disponibilité Flotte</p>
                    <div className="flex items-baseline gap-2">
                    <p className={`text-2xl font-bold ${
                        (stats.busImmobilises ?? 0) === 0 ? 'text-success-600' : 'text-danger-600'
                    }`}>
                        {stats.busDisponibles ?? stats.busTotaux ?? 0}
                      </p>
                      <span className="text-xs text-slate-500">
                        / {stats.busTotaux ?? 0} bus
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(stats.busImmobilises ?? 0) === 0
                        ? '✓ Tous opérationnels'
                        : `🚨 ${stats.busImmobilises} immobilisé${stats.busImmobilises > 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                </div>

                {/* Statut Maintenance (Conservé mais avec alerte bus bloquants) */}
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className={`w-5 h-5 ${
                      (stats.busImmobilises ?? 0) > 0 
                        ? 'text-danger-600' 
                        : stats.alertesMaintenance > 0 
                          ? 'text-warning-600' 
                          : 'text-success-600'
                    }`} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Maintenance</p>
                    <p className={`text-2xl font-bold ${
                      (stats.busImmobilises ?? 0) > 0 
                        ? 'text-danger-600' 
                        : stats.alertesMaintenance > 0 
                          ? 'text-warning-600' 
                          : 'text-success-600'
                    }`}>
                      {(stats.busImmobilises ?? 0) > 0 
                        ? `${stats.busImmobilises} bloquant${stats.busImmobilises > 1 ? 's' : ''}` 
                        : stats.alertesMaintenance > 0 
                          ? `${stats.alertesMaintenance} préventive${stats.alertesMaintenance > 1 ? 's' : ''}`
                          : 'À jour ✓'
                      }
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(stats.busImmobilises ?? 0) > 0 
                        ? 'Action immédiate requise'
                        : stats.alertesMaintenance > 0 
                          ? 'À planifier prochainement'
                          : 'Aucune intervention urgente'
                      }
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
