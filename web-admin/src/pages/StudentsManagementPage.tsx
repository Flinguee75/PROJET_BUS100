/**
 * Page de Gestion des Élèves
 * Interface CRUD complète pour la gestion des élèves
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Edit2, Trash2, Users, X, AlertTriangle, MapPin } from 'lucide-react';
import * as studentApi from '@/services/student.api';

interface StudentFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  grade: string;
  parentIds: string;
  commune: string;
  quartier: string;
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
    commune: '',
    quartier: '',
    pickupAddress: '',
    pickupLat: '5.3600',
    pickupLng: '-4.0083',
    dropoffAddress: '',
    dropoffLat: '5.3600',
    dropoffLng: '-4.0083',
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
      commune: '',
      quartier: '',
      pickupAddress: '',
      pickupLat: '5.3600',
      pickupLng: '-4.0083',
      dropoffAddress: '',
      dropoffLat: '5.3600',
      dropoffLng: '-4.0083',
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
      commune: student.commune || '',
      quartier: student.quartier || '',
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
        commune: formData.commune || undefined,
        quartier: formData.quartier || undefined,
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
        commune: formData.commune || 'Non spécifiée',
        quartier: formData.quartier || 'Non spécifié',
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
    <div className="flex-1 bg-neutral-50">
      <Header title="Gestion des Élèves" subtitle="Interface complète pour gérer les élèves" />

      <div className="p-8">
        {/* En-tête avec bouton d'ajout */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">Liste des Élèves</h2>
            <p className="text-slate-600 mt-1">
              {students?.length || 0} élève(s) enregistré(s)
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Ajouter un élève</span>
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Chargement des élèves..." />
          </div>
        )}

        {error && <ErrorMessage message="Impossible de charger les élèves" />}

        {!isLoading && !error && students && students.length === 0 && (
          <EmptyState
            icon={Users}
            title="Aucun élève enregistré"
            description="Utilisez le bouton 'Ajouter un élève' ci-dessus pour commencer à gérer les inscriptions"
          />
        )}

        {!isLoading && !error && students && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Nom Complet
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Date de naissance
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Bus assigné
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
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {student.firstName} {student.lastName}
                      </div>
                      {student.specialNeeds && (
                        <div className="flex items-center gap-1 text-xs text-warning-700 mt-1">
                          <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                          <span>Besoins spéciaux</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.grade}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      {student.busId ? (
                        <span className="text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-1 rounded-md">
                          Bus {student.busId.substring(0, 8)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                          student.isActive
                            ? 'bg-success-50 text-success-700 border-success-200'
                            : 'bg-danger-50 text-danger-700 border-danger-200'
                        }`}
                      >
                        {student.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(student.id, `${student.firstName} ${student.lastName}`)
                          }
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
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  {editingStudentId ? 'Modifier l\'élève' : 'Ajouter un nouvel élève'}
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
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Date de naissance *
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Classe *
                    </label>
                    <input
                      type="text"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      placeholder="Ex: CM2, 6ème..."
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  {!editingStudentId && (
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        IDs des parents (séparés par des virgules) *
                      </label>
                      <input
                        type="text"
                        name="parentIds"
                        value={formData.parentIds}
                        onChange={handleInputChange}
                        placeholder="parent-1, parent-2"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        required
                      />
                    </div>
                  )}

                  {/* Localisation géographique */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Commune (Abidjan)
                    </label>
                    <input
                      type="text"
                      name="commune"
                      value={formData.commune}
                      onChange={handleInputChange}
                      placeholder="Ex: Cocody, Yopougon..."
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Quartier
                    </label>
                    <input
                      type="text"
                      name="quartier"
                      value={formData.quartier}
                      onChange={handleInputChange}
                      placeholder="Ex: Riviera, II Plateaux..."
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  {/* Adresse de ramassage */}
                  <div className="col-span-2 border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-slate-600" strokeWidth={2} />
                      <h4 className="font-semibold text-slate-800">Adresse de ramassage</h4>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      name="pickupAddress"
                      value={formData.pickupAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="pickupLat"
                      value={formData.pickupLat}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="pickupLng"
                      value={formData.pickupLng}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  {/* Adresse de dépôt */}
                  <div className="col-span-2 border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-slate-600" strokeWidth={2} />
                      <h4 className="font-semibold text-slate-800">Adresse de dépôt</h4>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      name="dropoffAddress"
                      value={formData.dropoffAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="dropoffLat"
                      value={formData.dropoffLat}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="dropoffLng"
                      value={formData.dropoffLng}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  {/* Besoins spéciaux */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Besoins spéciaux (optionnel)
                    </label>
                    <textarea
                      name="specialNeeds"
                      value={formData.specialNeeds}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Allergies, handicap, autres informations importantes..."
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

