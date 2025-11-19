/**
 * Page de Gestion des Maintenances
 * Interface CRUD complète pour la gestion des maintenances des bus
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useAuthContext } from '@/contexts/AuthContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import * as maintenanceApi from '@/services/maintenance.api';
import * as busApi from '@/services/bus.api';

interface MaintenanceFormData {
  busId: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  scheduledDate: string;
  cost: string;
  notes: string;
  status?: string;
  completedDate?: string;
}

const maintenanceTypeLabels: Record<string, string> = {
  mechanical: 'Mécanique',
  electrical: 'Électrique',
  tire: 'Pneus',
  body: 'Carrosserie',
  safety: 'Sécurité',
  cleaning: 'Nettoyage',
  inspection: 'Inspection',
  other: 'Autre',
};

const severityLabels: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique',
};

const statusLabels: Record<string, string> = {
  reported: 'Signalé',
  scheduled: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-danger-50 text-danger-700 border-danger-200';
    case 'high':
      return 'bg-warning-50 text-warning-700 border-warning-200';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-success-50 text-success-700 border-success-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-success-50 text-success-700 border-success-200';
    case 'in_progress':
      return 'bg-primary-50 text-primary-700 border-primary-200';
    case 'scheduled':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'reported':
      return 'bg-warning-50 text-warning-700 border-warning-200';
    case 'cancelled':
      return 'bg-slate-50 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const MaintenancePage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<string | null>(null);
  const [filterBusId, setFilterBusId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [formData, setFormData] = useState<MaintenanceFormData>({
    busId: '',
    type: maintenanceApi.MaintenanceType.MECHANICAL,
    severity: maintenanceApi.MaintenanceSeverity.MEDIUM,
    title: '',
    description: '',
    scheduledDate: '',
    cost: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');

  // Récupérer la liste des maintenances
  const {
    data: maintenances,
    isLoading: isLoadingMaintenances,
    error: maintenancesError,
  } = useQuery({
    queryKey: ['maintenances', filterBusId, filterStatus],
    queryFn: () => {
      const filter: maintenanceApi.MaintenanceFilter = {};
      if (filterBusId) filter.busId = filterBusId;
      if (filterStatus) filter.status = filterStatus as maintenanceApi.MaintenanceStatus;
      return maintenanceApi.getAllMaintenances(Object.keys(filter).length > 0 ? filter : undefined);
    },
  });

  // Récupérer la liste des bus pour le dropdown
  const { data: buses } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busApi.getAllBuses(false),
  });

  // Mutation pour créer une maintenance
  const createMutation = useMutation({
    mutationFn: maintenanceApi.createMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Mutation pour mettre à jour une maintenance
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: maintenanceApi.MaintenanceUpdateInput }) =>
      maintenanceApi.updateMaintenance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Mutation pour supprimer une maintenance
  const deleteMutation = useMutation({
    mutationFn: maintenanceApi.deleteMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
    },
  });

  const openCreateModal = () => {
    setEditingMaintenanceId(null);
    setFormData({
      busId: '',
      type: maintenanceApi.MaintenanceType.MECHANICAL,
      severity: maintenanceApi.MaintenanceSeverity.MEDIUM,
      title: '',
      description: '',
      scheduledDate: '',
      cost: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (maintenance: maintenanceApi.MaintenanceBackend) => {
    setEditingMaintenanceId(maintenance.id);
    setFormData({
      busId: maintenance.busId,
      type: maintenance.type,
      severity: maintenance.severity,
      title: maintenance.title,
      description: maintenance.description,
      scheduledDate: maintenance.scheduledDate
        ? new Date(maintenance.scheduledDate).toISOString().split('T')[0]
        : '',
      cost: maintenance.cost?.toString() || '',
      notes: maintenance.notes || '',
      status: maintenance.status,
      completedDate: maintenance.completedDate
        ? new Date(maintenance.completedDate).toISOString().split('T')[0]
        : '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMaintenanceId(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.busId || !formData.title || !formData.description) {
      setFormError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!user) {
      setFormError('Vous devez être connecté pour créer une maintenance');
      return;
    }

    try {
      if (editingMaintenanceId) {
        // Mise à jour
        const updateData: maintenanceApi.MaintenanceUpdateInput = {
          type: formData.type as maintenanceApi.MaintenanceType,
          severity: formData.severity as maintenanceApi.MaintenanceSeverity,
          title: formData.title,
          description: formData.description,
          scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          notes: formData.notes || undefined,
          status: formData.status as maintenanceApi.MaintenanceStatus | undefined,
          completedDate: formData.completedDate ? new Date(formData.completedDate) : undefined,
        };
        await updateMutation.mutateAsync({ id: editingMaintenanceId, data: updateData });
      } else {
        // Création
        const createData: maintenanceApi.MaintenanceCreateInput = {
          busId: formData.busId,
          type: formData.type as maintenanceApi.MaintenanceType,
          severity: formData.severity as maintenanceApi.MaintenanceSeverity,
          title: formData.title,
          description: formData.description,
          reportedBy: user.uid,
          scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
          cost: formData.cost ? parseFloat(formData.cost) : undefined,
          notes: formData.notes || undefined,
        };
        await createMutation.mutateAsync(createData);
      }
    } catch (error) {
      console.error('Error submitting maintenance:', error);
    }
  };

  const handleDelete = async (maintenanceId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
      await deleteMutation.mutateAsync(maintenanceId);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoadingMaintenances) {
    return <LoadingSpinner message="Chargement des maintenances..." />;
  }

  if (maintenancesError) {
    return <ErrorMessage message={(maintenancesError as Error).message} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header title="Gestion des Maintenances" subtitle="Suivre et gérer les opérations de maintenance" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres et bouton d'ajout */}
        <div className="mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filtrer par bus
            </label>
            <select
              value={filterBusId}
              onChange={(e) => setFilterBusId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="">Tous les bus</option>
              {buses?.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.plateNumber} - {bus.model}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Filtrer par statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-card hover:shadow-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Nouvelle maintenance</span>
          </button>
        </div>

        {/* Tableau des maintenances */}
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Sévérité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Signalé le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {maintenances && maintenances.length > 0 ? (
                maintenances.map((maintenance) => {
                  const bus = buses?.find((b) => b.id === maintenance.busId);
                  return (
                    <tr key={maintenance.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {bus?.plateNumber || maintenance.busId}
                        </div>
                        <div className="text-sm text-slate-500">{bus?.model}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">
                          {maintenance.title}
                        </div>
                        <div className="text-sm text-slate-500 line-clamp-1">
                          {maintenance.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900">
                          {maintenanceTypeLabels[maintenance.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                            maintenance.severity
                          )}`}
                        >
                          {severityLabels[maintenance.severity]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            maintenance.status
                          )}`}
                        >
                          {statusLabels[maintenance.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(maintenance.reportedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(maintenance)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDelete(maintenance.id)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Aucune maintenance trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création/modification */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingMaintenanceId ? 'Modifier la Maintenance' : 'Nouveau Rapport de Maintenance'}
              </h2>

              {formError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Bus */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bus *
                  </label>
                  <select
                    value={formData.busId}
                    onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    required
                    disabled={!!editingMaintenanceId}
                  >
                    <option value="">Sélectionner un bus</option>
                    {buses?.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.plateNumber} - {bus.model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type et Sévérité */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      required
                    >
                      {Object.entries(maintenanceTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sévérité *
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      required
                    >
                      {Object.entries(severityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    placeholder="Ex: Problème de freins"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    rows={3}
                    placeholder="Décrire le problème en détail..."
                    required
                  />
                </div>

                {/* Statut (seulement en édition) */}
                {editingMaintenanceId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Date planifiée et Coût */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date planifiée
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Coût (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Date de fin (seulement en édition et si statut = completed) */}
                {editingMaintenanceId && formData.status === 'completed' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={formData.completedDate}
                      onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes additionnelles
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    rows={2}
                    placeholder="Notes optionnelles..."
                  />
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Enregistrement...'
                      : editingMaintenanceId
                      ? 'Mettre à jour'
                      : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
