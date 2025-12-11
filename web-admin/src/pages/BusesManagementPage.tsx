/**
 * Page de Gestion des Bus (Design Professionnel)
 * Interface CRUD complète pour la gestion des bus
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Bus as BusIcon, Users as UsersIcon, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import * as busApi from '@/services/bus.api';
import * as driverApi from '@/services/driver.api';

interface BusFormData {
  busNumber: string;
  plateNumber: string;
  capacity: string;
  model: string;
  year: string;
  driverId: string;
  assignedCommune: string;
}

export const BusesManagementPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusFormData>({
    busNumber: '',
    plateNumber: '',
    capacity: '',
    model: 'Bus Standard',
    year: new Date().getFullYear().toString(),
    driverId: '',
    assignedCommune: '',
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

  // Récupérer la liste des chauffeurs
  const {
    data: drivers = [],
    isLoading: driversLoading,
    error: driversError
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driverApi.getAllDrivers(),
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
      busNumber: '',
      plateNumber: '',
      capacity: '',
      model: 'Bus Standard',
      year: new Date().getFullYear().toString(),
      driverId: '',
      assignedCommune: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (bus: busApi.BusBackend) => {
    setEditingBusId(bus.id);
    setFormData({
      busNumber: bus.busNumber.toString(),
      plateNumber: bus.plateNumber,
      capacity: bus.capacity.toString(),
      model: bus.model || 'Bus Standard',
      year: bus.year?.toString() || new Date().getFullYear().toString(),
      driverId: bus.driverId || '',
      assignedCommune: bus.assignedCommune || '',
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
    const busNumber = parseInt(formData.busNumber);
    const capacity = parseInt(formData.capacity);
    const year = parseInt(formData.year);

    if (!formData.busNumber || !formData.plateNumber || !formData.capacity) {
      setFormError('Le numéro, la plaque et la capacité sont requis');
      return;
    }

    if (isNaN(busNumber) || busNumber < 1) {
      setFormError('Le numéro de bus doit être un nombre positif');
      return;
    }

    if (isNaN(capacity) || capacity < 1 || capacity > 100) {
      setFormError('La capacité doit être un nombre entre 1 et 100');
      return;
    }

    if (!formData.model.trim()) {
      setFormError('Le modèle est requis');
      return;
    }

    if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      setFormError('L\'année doit être valide');
      return;
    }

    if (editingBusId) {
      // Mode édition - on peut mettre à jour tous les champs
      const updateData: busApi.BusUpdateInput = {
        busNumber,
        plateNumber: formData.plateNumber,
        capacity,
        model: formData.model,
        year,
        driverId: formData.driverId || null,
        assignedCommune: formData.assignedCommune || undefined,
      };
      updateMutation.mutate({ id: editingBusId, data: updateData });
    } else {
      // Mode création
      const createData: busApi.BusCreateInput = {
        busNumber,
        plateNumber: formData.plateNumber,
        capacity,
        model: formData.model,
        year,
      };
      createMutation.mutate(createData);
    }
  };

  const handleDelete = (busId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bus ?')) {
      deleteMutation.mutate(busId);
    }
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
                    Numéro de Bus
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Chauffeur
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Capacité
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
                          Bus {bus.busNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">
                        {bus.driverName || bus.driverId || 'Non assigné'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">
                        {bus.assignedCommune || 'Non assignée'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <UsersIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                        {bus.capacity} places
                      </div>
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
            <p className="text-slate-600 max-w-md mx-auto">
              Utilisez le bouton "Ajouter un bus" ci-dessus pour commencer à gérer votre flotte de transport scolaire
            </p>
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
              {formError && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Numéro de bus *
                  </label>
                  <input
                    type="number"
                    value={formData.busNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, busNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 bg-white"
                    placeholder="Ex: 1, 2, 3..."
                    min="1"
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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 bg-white"
                    placeholder="50"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Plaque d'immatriculation *
                </label>
                <input
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, plateNumber: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 bg-white"
                  placeholder="Ex: TU 123 TN 456"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 bg-white"
                    placeholder="Ex: Bus Standard, Mercedes..."
                    required
                  />
                </div>

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
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 bg-white"
                    placeholder={new Date().getFullYear().toString()}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Chauffeur {editingBusId && '(optionnel)'}
                </label>
                <select
                  value={formData.driverId}
                  onChange={(e) =>
                    setFormData({ ...formData, driverId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 bg-white"
                  disabled={driversLoading}
                >
                  <option value="">
                    {driversLoading
                      ? 'Chargement des chauffeurs...'
                      : driversError
                      ? 'Erreur de chargement des chauffeurs'
                      : drivers.length === 0
                      ? 'Aucun chauffeur disponible'
                      : 'Aucun chauffeur assigné'}
                  </option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.displayName} - {driver.phoneNumber}
                    </option>
                  ))}
                </select>
                {driversError && (
                  <p className="text-sm text-danger-600 mt-1">
                    Impossible de charger les chauffeurs. Vérifiez que le backend est démarré.
                  </p>
                )}
                {!driversLoading && !driversError && drivers.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    Aucun chauffeur trouvé. Lancez le seed : <code className="bg-slate-100 px-1 rounded">npm run seed</code>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Zone (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.assignedCommune}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedCommune: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-900 bg-white"
                  placeholder="Ex: Cocody, Yopougon..."
                />
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

