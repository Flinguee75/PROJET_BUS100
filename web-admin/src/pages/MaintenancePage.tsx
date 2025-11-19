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
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'scheduled':
      return 'bg-purple-100 text-purple-800';
    case 'reported':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
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
    <div className="min-h-screen bg-gray-50">
      <Header title="Gestion des Maintenances" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres et bouton d'ajout */}
        <div className="mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par bus
            </label>
            <select
              value={filterBusId}
              onChange={(e) => setFilterBusId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par statut
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Nouveau Rapport
          </button>
        </div>

        {/* Tableau des maintenances */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sévérité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Signalé le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenances && maintenances.length > 0 ? (
                maintenances.map((maintenance) => {
                  const bus = buses?.find((b) => b.id === maintenance.busId);
                  return (
                    <tr key={maintenance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {bus?.plateNumber || maintenance.busId}
                        </div>
                        <div className="text-sm text-gray-500">{bus?.model}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {maintenance.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {maintenance.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(maintenance.reportedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(maintenance)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(maintenance.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus *
                  </label>
                  <select
                    value={formData.busId}
                    onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sévérité *
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ex: Problème de freins"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Décrire le problème en détail..."
                    required
                  />
                </div>

                {/* Statut (seulement en édition) */}
                {editingMaintenanceId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date planifiée
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coût (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Date de fin (seulement en édition et si statut = completed) */}
                {editingMaintenanceId && formData.status === 'completed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={formData.completedDate}
                      onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes additionnelles
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Notes optionnelles..."
                  />
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
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
