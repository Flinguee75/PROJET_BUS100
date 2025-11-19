/**
 * Page de Gestion des Chauffeurs
 * Interface CRUD complète pour la gestion des chauffeurs
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
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
    <div className="flex-1 bg-gray-50">
      <Header title="Gestion des Chauffeurs" />

      <div className="p-8">
        {/* En-tête avec bouton d'ajout */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Liste des Chauffeurs
            </h2>
            <p className="text-gray-600 mt-1">
              {drivers?.length || 0} chauffeur(s) enregistré(s)
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            + Ajouter un chauffeur
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Chargement des chauffeurs..." />
          </div>
        )}

        {error && <ErrorMessage message="Impossible de charger les chauffeurs" />}

        {!isLoading && !error && drivers && drivers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">Aucun chauffeur enregistré</p>
            <p className="text-gray-400 mt-2">
              Cliquez sur "Ajouter un chauffeur" pour commencer
            </p>
          </div>
        )}

        {!isLoading && !error && drivers && drivers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Téléphone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    N° Permis
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Expiration Permis
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Bus assigné
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {driver.displayName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{driver.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {driver.phoneNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {driver.licenseNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {new Date(driver.licenseExpiry).toLocaleDateString('fr-FR')}
                      </div>
                      {isLicenseExpired(driver.licenseExpiry) && (
                        <div className="text-xs text-red-600 mt-1">⚠️ Expiré</div>
                      )}
                      {!isLicenseExpired(driver.licenseExpiry) &&
                        isLicenseExpiringSoon(driver.licenseExpiry) && (
                          <div className="text-xs text-amber-600 mt-1">
                            ⚠️ Expire bientôt
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      {driver.busId ? (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Bus {driver.busId.substring(0, 8)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          driver.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {driver.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(driver)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id, driver.displayName)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
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

        {/* Modal de création/édition */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingDriverId ? 'Modifier le chauffeur' : 'Ajouter un nouveau chauffeur'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Informations personnelles */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!!editingDriverId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required={!editingDriverId}
                    />
                    {editingDriverId && (
                      <p className="text-xs text-gray-500 mt-1">
                        L'email ne peut pas être modifié
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+33612345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de permis *
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'expiration du permis *
                    </label>
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL de la photo (optionnel)
                    </label>
                    <input
                      type="url"
                      name="photoUrl"
                      value={formData.photoUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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

