/**
 * Page de Gestion des Chauffeurs
 * Interface CRUD complète pour la gestion des chauffeurs
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Edit2, Trash2, UserCog, X, AlertTriangle, CreditCard, Calendar, Eye } from 'lucide-react';
import * as driverApi from '@/services/driver.api';

interface DriverFormData {
  email: string;
  displayName: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  photoUrl: string;
}

export const DriversManagementPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<driverApi.Driver | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DriverFormData>({
    email: '',
    displayName: '',
    phoneNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    photoUrl: '',
  });
  const [formError, setFormError] = useState('');

  // Récupérer la liste des chauffeurs
  const {
    data: drivers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: driverApi.getAllDrivers,
  });

  // Mutation pour créer un chauffeur
  const createMutation = useMutation({
    mutationFn: driverApi.createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Mutation pour mettre à jour un chauffeur
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: driverApi.DriverUpdateInput }) =>
      driverApi.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Mutation pour supprimer un chauffeur
  const deleteMutation = useMutation({
    mutationFn: driverApi.deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const openCreateModal = () => {
    setEditingDriverId(null);
    setFormData({
      email: '',
      displayName: '',
      phoneNumber: '',
      licenseNumber: '',
      licenseExpiry: '',
      photoUrl: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (driver: driverApi.Driver) => {
    setEditingDriverId(driver.id);
    setFormData({
      email: driver.email,
      displayName: driver.displayName,
      phoneNumber: driver.phoneNumber,
      licenseNumber: driver.licenseNumber,
      licenseExpiry: driver.licenseExpiry.split('T')[0],
      photoUrl: driver.photoUrl || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriverId(null);
    setFormError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (
      !formData.displayName ||
      !formData.phoneNumber ||
      !formData.licenseNumber ||
      !formData.licenseExpiry
    ) {
      setFormError('Tous les champs obligatoires doivent être remplis');
      return false;
    }

    if (!editingDriverId && !formData.email) {
      setFormError('L\'email est requis pour créer un chauffeur');
      return false;
    }

    // Vérifier que la date d'expiration du permis est dans le futur
    const expiryDate = new Date(formData.licenseExpiry);
    const today = new Date();
    if (expiryDate <= today) {
      setFormError('La date d\'expiration du permis doit être dans le futur');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    if (editingDriverId) {
      // Mode édition
      const updateData: driverApi.DriverUpdateInput = {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: new Date(formData.licenseExpiry).toISOString(),
        photoUrl: formData.photoUrl || undefined,
      };
      updateMutation.mutate({ id: editingDriverId, data: updateData });
    } else {
      // Mode création
      const createData: driverApi.DriverCreateInput = {
        email: formData.email,
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: new Date(formData.licenseExpiry).toISOString(),
        photoUrl: formData.photoUrl || undefined,
      };
      createMutation.mutate(createData);
    }
  };

  const handleDelete = async (driverId: string, driverName: string) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le chauffeur "${driverName}" ?`
    );
    if (confirmDelete) {
      deleteMutation.mutate(driverId);
    }
  };

  const isLicenseExpiringSoon = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > today;
  };

  const isLicenseExpired = (expiryDate: string): boolean => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry <= today;
  };

  return (
    <div className="flex-1 bg-neutral-50">
      <Header title="Gestion des Chauffeurs" subtitle="Interface complète pour gérer les chauffeurs" />

      <div className="p-8">
        {/* En-tête avec bouton d'ajout */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Liste des Chauffeurs
            </h2>
            <p className="text-slate-600 mt-1">
              {drivers?.length || 0} chauffeur(s) enregistré(s)
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Ajouter un chauffeur</span>
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Chargement des chauffeurs..." />
          </div>
        )}

        {error && <ErrorMessage message="Impossible de charger les chauffeurs" />}

        {!isLoading && !error && drivers && drivers.length === 0 && (
          <EmptyState
            icon={UserCog}
            title="Aucun chauffeur enregistré"
            description="Utilisez le bouton 'Ajouter un chauffeur' ci-dessus pour commencer à gérer l'équipe"
          />
        )}

        {!isLoading && !error && drivers && drivers.length > 0 && (
          <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {driver.displayName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {driver.phoneNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                          driver.isActive
                            ? 'bg-success-50 text-success-700 border-success-200'
                            : 'bg-danger-50 text-danger-700 border-danger-200'
                        }`}
                      >
                        {driver.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            setIsDetailsModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-all font-medium text-sm flex items-center gap-1.5"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" strokeWidth={2} />
                          <span>Voir détails</span>
                        </button>
                        <button
                          onClick={() => openEditModal(driver)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id, driver.displayName)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
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

        {/* Modal de création/édition */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  {editingDriverId ? 'Modifier le chauffeur' : 'Ajouter un nouveau chauffeur'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                  type="button"
                >
                  <X className="w-5 h-5 text-slate-500" strokeWidth={2} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {formError && (
                  <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Informations personnelles */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!!editingDriverId}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                      required={!editingDriverId}
                    />
                    {editingDriverId && (
                      <p className="text-xs text-slate-500 mt-1">
                        L'email ne peut pas être modifié
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+225 XX XX XX XX XX"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Numéro de permis *</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Date d'expiration *</span>
                    </label>
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      URL de la photo (optionnel)
                    </label>
                    <input
                      type="url"
                      name="photoUrl"
                      value={formData.photoUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-all font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium shadow-md disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Enregistrement...'
                      : editingDriverId
                      ? 'Mettre à jour'
                      : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

