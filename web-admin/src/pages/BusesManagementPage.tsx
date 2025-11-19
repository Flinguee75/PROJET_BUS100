/**
 * Page de Gestion des Bus (Design Professionnel)
 * Interface CRUD complète pour la gestion des bus
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Bus as BusIcon, Calendar, Users as UsersIcon, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import * as busApi from '@/services/bus.api';

interface BusFormData {
  plateNumber: string;
  model: string;
  year: string;
  capacity: string;
}

export const BusesManagementPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusFormData>({
    plateNumber: '',
    model: '',
    year: '',
    capacity: '',
  });
  const [formError, setFormError] = useState('');

  // Récupérer la liste des bus
  const {
    data: buses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busApi.getAllBuses(false),
  });

  // Mutation pour créer un bus
  const createMutation = useMutation({
    mutationFn: busApi.createBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Mutation pour mettre à jour un bus
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: busApi.BusUpdateInput }) =>
      busApi.updateBus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Mutation pour supprimer un bus
  const deleteMutation = useMutation({
    mutationFn: busApi.deleteBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });

  const openCreateModal = () => {
    setEditingBusId(null);
    setFormData({
      plateNumber: '',
      model: '',
      year: '',
      capacity: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (bus: busApi.BusBackend) => {
    setEditingBusId(bus.id);
    setFormData({
      plateNumber: bus.plateNumber,
      model: bus.model,
      year: bus.year.toString(),
      capacity: bus.capacity.toString(),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBusId(null);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    const year = parseInt(formData.year);
    const capacity = parseInt(formData.capacity);

    if (!formData.plateNumber || !formData.model || !year || !capacity) {
      setFormError('Tous les champs sont requis');
      return;
    }

    if (year < 1900 || year > new Date().getFullYear() + 1) {
      setFormError('Année invalide');
      return;
    }

    if (capacity < 1 || capacity > 100) {
      setFormError('La capacité doit être entre 1 et 100');
      return;
    }

    const data = {
      plateNumber: formData.plateNumber,
      model: formData.model,
      year,
      capacity,
    };

    if (editingBusId) {
      updateMutation.mutate({ id: editingBusId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (busId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bus ?')) {
      deleteMutation.mutate(busId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'Actif', color: 'bg-success-50 text-success-700 border-success-200' },
      inactive: { label: 'Inactif', color: 'bg-slate-100 text-slate-700 border-slate-200' },
      in_maintenance: { label: 'En maintenance', color: 'bg-warning-50 text-warning-700 border-warning-200' },
      out_of_service: { label: 'Hors service', color: 'bg-danger-50 text-danger-700 border-danger-200' },
    };

    const statusInfo = statusMap[status] || statusMap.active;
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="flex-1 bg-neutral-50">
      <Header title="Gestion des Bus" subtitle="Gérer la flotte de véhicules" />

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header avec bouton d'ajout */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">Liste des bus</h2>
            <p className="text-slate-600 mt-1 text-sm flex items-center gap-2">
              <BusIcon className="w-4 h-4" strokeWidth={2} />
              <span>{buses?.length || 0} bus au total</span>
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Ajouter un bus</span>
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Chargement des bus..." />
          </div>
        )}

        {/* Error state */}
        {error && (
          <ErrorMessage message="Impossible de charger les bus" />
        )}

        {/* Table des bus */}
        {buses && buses.length > 0 && (
          <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Immatriculation
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Modèle
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Année
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Capacité
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {buses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <BusIcon className="w-4 h-4 text-slate-400" strokeWidth={2} />
                        <span className="text-sm font-semibold text-slate-900">
                          {bus.plateNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">{bus.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                        {bus.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <UsersIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                        {bus.capacity} places
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(bus.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(bus)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDelete(bus.id)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
                          disabled={deleteMutation.isPending}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {buses && buses.length === 0 && !isLoading && (
          <div className="bg-white rounded-xl shadow-card border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BusIcon className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">
              Aucun bus enregistré
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Commencez par ajouter votre premier bus à la flotte pour gérer le transport scolaire
            </p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" strokeWidth={2} />
              <span>Ajouter un bus</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 font-display">
                {editingBusId ? 'Modifier le bus' : 'Ajouter un bus'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <X className="w-5 h-5 text-slate-500" strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Immatriculation *
                </label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, plateNumber: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Ex: TU 123 TN 456"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Modèle *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Ex: Mercedes-Benz Sprinter"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Année *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Capacité *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="50"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-all font-medium"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed font-medium shadow-md"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Enregistrement...'
                    : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

