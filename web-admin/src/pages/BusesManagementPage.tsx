/**
 * Page de Gestion des Bus
 * Interface CRUD complète pour la gestion des bus
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
      inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-700' },
      in_maintenance: { label: 'En maintenance', color: 'bg-yellow-100 text-yellow-700' },
      out_of_service: { label: 'Hors service', color: 'bg-red-100 text-red-700' },
    };

    const statusInfo = statusMap[status] || statusMap.active;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Gestion des Bus" />

      <div className="p-8">
        {/* Header avec bouton d'ajout */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Liste des bus</h2>
            <p className="text-gray-600 mt-1">
              {buses?.length || 0} bus au total
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
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
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Immatriculation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modèle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Année
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {bus.plateNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bus.model}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{bus.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bus.capacity} places
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(bus.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(bus)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDelete(bus.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteMutation.isPending}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {buses && buses.length === 0 && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🚌</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun bus enregistré
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par ajouter votre premier bus
            </p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ajouter un bus
            </button>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingBusId ? 'Modifier le bus' : 'Ajouter un bus'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immatriculation *
                </label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, plateNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: TU 123 TN 456"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modèle *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Mercedes-Benz Sprinter"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année *
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacité *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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

