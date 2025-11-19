/**
 * Page de Gestion des Élèves
 * Interface CRUD complète pour la gestion des élèves
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import * as studentApi from '@/services/student.api';

interface StudentFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  grade: string;
  parentIds: string;
  pickupAddress: string;
  pickupLat: string;
  pickupLng: string;
  dropoffAddress: string;
  dropoffLat: string;
  dropoffLng: string;
  specialNeeds: string;
}

export const StudentsManagementPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    grade: '',
    parentIds: '',
    pickupAddress: '',
    pickupLat: '36.8065',
    pickupLng: '10.1815',
    dropoffAddress: '',
    dropoffLat: '36.8065',
    dropoffLng: '10.1815',
    specialNeeds: '',
  });
  const [formError, setFormError] = useState('');

  // Récupérer la liste des élèves
  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['students'],
    queryFn: studentApi.getAllStudents,
  });

  // Mutation pour créer un élève
  const createMutation = useMutation({
    mutationFn: studentApi.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Mutation pour mettre à jour un élève
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: studentApi.StudentUpdateInput }) =>
      studentApi.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  // Mutation pour supprimer un élève
  const deleteMutation = useMutation({
    mutationFn: studentApi.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const openCreateModal = () => {
    setEditingStudentId(null);
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      grade: '',
      parentIds: '',
      pickupAddress: '',
      pickupLat: '36.8065',
      pickupLng: '10.1815',
      dropoffAddress: '',
      dropoffLat: '36.8065',
      dropoffLng: '10.1815',
      specialNeeds: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (student: studentApi.Student) => {
    setEditingStudentId(student.id);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth.split('T')[0],
      grade: student.grade,
      parentIds: student.parentIds.join(', '),
      pickupAddress: student.pickupLocation.address,
      pickupLat: student.pickupLocation.lat.toString(),
      pickupLng: student.pickupLocation.lng.toString(),
      dropoffAddress: student.dropoffLocation.address,
      dropoffLat: student.dropoffLocation.lat.toString(),
      dropoffLng: student.dropoffLocation.lng.toString(),
      specialNeeds: student.specialNeeds || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudentId(null);
    setFormError('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.dateOfBirth ||
      !formData.grade ||
      !formData.parentIds ||
      !formData.pickupAddress ||
      !formData.dropoffAddress
    ) {
      setFormError('Tous les champs obligatoires doivent être remplis');
      return false;
    }

    const lat1 = parseFloat(formData.pickupLat);
    const lng1 = parseFloat(formData.pickupLng);
    const lat2 = parseFloat(formData.dropoffLat);
    const lng2 = parseFloat(formData.dropoffLng);

    if (
      isNaN(lat1) ||
      isNaN(lng1) ||
      isNaN(lat2) ||
      isNaN(lng2) ||
      lat1 < -90 ||
      lat1 > 90 ||
      lng1 < -180 ||
      lng1 > 180 ||
      lat2 < -90 ||
      lat2 > 90 ||
      lng2 < -180 ||
      lng2 > 180
    ) {
      setFormError('Coordonnées GPS invalides');
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

    const parentIdsArray = formData.parentIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id);

    if (parentIdsArray.length === 0) {
      setFormError('Au moins un ID de parent est requis');
      return;
    }

    if (editingStudentId) {
      // Mode édition
      const updateData: studentApi.StudentUpdateInput = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        grade: formData.grade,
        pickupLocation: {
          address: formData.pickupAddress,
          lat: parseFloat(formData.pickupLat),
          lng: parseFloat(formData.pickupLng),
        },
        dropoffLocation: {
          address: formData.dropoffAddress,
          lat: parseFloat(formData.dropoffLat),
          lng: parseFloat(formData.dropoffLng),
        },
        specialNeeds: formData.specialNeeds || undefined,
      };
      updateMutation.mutate({ id: editingStudentId, data: updateData });
    } else {
      // Mode création
      const createData: studentApi.StudentCreateInput = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        grade: formData.grade,
        parentIds: parentIdsArray,
        pickupLocation: {
          address: formData.pickupAddress,
          lat: parseFloat(formData.pickupLat),
          lng: parseFloat(formData.pickupLng),
        },
        dropoffLocation: {
          address: formData.dropoffAddress,
          lat: parseFloat(formData.dropoffLat),
          lng: parseFloat(formData.dropoffLng),
        },
        specialNeeds: formData.specialNeeds || undefined,
      };
      createMutation.mutate(createData);
    }
  };

  const handleDelete = async (studentId: string, studentName: string) => {
    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'élève "${studentName}" ?`
    );
    if (confirmDelete) {
      deleteMutation.mutate(studentId);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Gestion des Élèves" />

      <div className="p-8">
        {/* En-tête avec bouton d'ajout */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Liste des Élèves</h2>
            <p className="text-gray-600 mt-1">
              {students?.length || 0} élève(s) enregistré(s)
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            + Ajouter un élève
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Chargement des élèves..." />
          </div>
        )}

        {error && <ErrorMessage message="Impossible de charger les élèves" />}

        {!isLoading && !error && students && students.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">Aucun élève enregistré</p>
            <p className="text-gray-400 mt-2">
              Cliquez sur "Ajouter un élève" pour commencer
            </p>
          </div>
        )}

        {!isLoading && !error && students && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Nom Complet
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Classe
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Date de naissance
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
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      {student.specialNeeds && (
                        <div className="text-xs text-amber-600 mt-1">
                          ⚠️ Besoins spéciaux
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{student.grade}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      {student.busId ? (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Bus {student.busId.substring(0, 8)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          student.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(student)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(student.id, `${student.firstName} ${student.lastName}`)
                        }
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
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingStudentId ? 'Modifier l\'élève' : 'Ajouter un nouvel élève'}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de naissance *
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classe *
                    </label>
                    <input
                      type="text"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      placeholder="Ex: CM2, 6ème..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {!editingStudentId && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IDs des parents (séparés par des virgules) *
                      </label>
                      <input
                        type="text"
                        name="parentIds"
                        value={formData.parentIds}
                        onChange={handleInputChange}
                        placeholder="parent-1, parent-2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}

                  {/* Adresse de ramassage */}
                  <div className="col-span-2 border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-3">Adresse de ramassage</h4>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      name="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="pickupLat"
                      value={formData.pickupLat}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="pickupLng"
                      value={formData.pickupLng}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Adresse de dépôt */}
                  <div className="col-span-2 border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-3">Adresse de dépôt</h4>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      name="dropoffAddress"
                      value={formData.dropoffAddress}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="dropoffLat"
                      value={formData.dropoffLat}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="dropoffLng"
                      value={formData.dropoffLng}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Besoins spéciaux */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Besoins spéciaux (optionnel)
                    </label>
                    <textarea
                      name="specialNeeds"
                      value={formData.specialNeeds}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Allergies, handicap, autres informations importantes..."
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
                      : editingStudentId
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

