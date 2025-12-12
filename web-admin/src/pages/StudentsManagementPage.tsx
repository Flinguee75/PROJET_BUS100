/**
 * Page de Gestion des Élèves
 * Interface CRUD complète pour la gestion des élèves
 */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Edit2, Trash2, Users, X, AlertTriangle, MapPin, Bus } from 'lucide-react';
import * as studentApi from '@/services/student.api';
import * as gpsApi from '@/services/gps.api';

interface StudentFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  grade: string;
  parentIds: string;
  commune: string;
  quartier: string;
  busId: string;
  scheduleMorning: boolean;
  scheduleMidday: boolean;
  scheduleEvening: boolean;
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
    busId: '',
    scheduleMorning: false,
    scheduleMidday: false,
    scheduleEvening: false,
    pickupAddress: '',
    pickupLat: '5.3600',
    pickupLng: '-4.0083',
    dropoffAddress: '',
    dropoffLat: '5.3600',
    dropoffLng: '-4.0083',
    specialNeeds: '',
  });
  const [formError, setFormError] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [busFilter, setBusFilter] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<studentApi.Student | null>(null);

  // Récupérer la liste des élèves
  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['students'],
    queryFn: studentApi.getAllStudents,
  });

  // Récupérer la liste des bus pour le sélecteur
  const { data: buses } = useQuery({
    queryKey: ['all-buses'],
    queryFn: gpsApi.getAllBuses,
  });

  const gradeOptions = useMemo(() => {
    if (!students) {
      return [];
    }
    const grades = new Set<string>();
    students.forEach((student) => {
      if (student.grade) {
        grades.add(student.grade);
      }
    });
    return Array.from(grades).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!students) {
      return [];
    }
    const zoneValue = zoneFilter.trim().toLowerCase();
    return students.filter((student) => {
      const commune = student.commune?.toLowerCase() || '';
      const quartier = student.quartier?.toLowerCase() || '';
      const matchesZone =
        !zoneValue ||
        commune.includes(zoneValue) ||
        quartier.includes(zoneValue);
      const matchesGrade = !gradeFilter || student.grade === gradeFilter;
      const matchesBus = !busFilter || student.busId === busFilter;
      return matchesZone && matchesGrade && matchesBus;
    });
  }, [students, zoneFilter, gradeFilter, busFilter]);

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
      busId: '',
      scheduleMorning: false,
      scheduleMidday: false,
      scheduleEvening: false,
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
      busId: student.busId || '',
      scheduleMorning: student.busSchedule?.morning || false,
      scheduleMidday: student.busSchedule?.midday || false,
      scheduleEvening: student.busSchedule?.evening || false,
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

  const resetFilters = () => {
    setZoneFilter('');
    setGradeFilter('');
    setBusFilter('');
  };

  const openDeleteModal = (student: studentApi.Student) => {
    setStudentToDelete(student);
  };

  const closeDeleteModal = () => {
    setStudentToDelete(null);
  };

  const confirmDelete = () => {
    if (!studentToDelete) {
      return;
    }
    deleteMutation.mutate(studentToDelete.id);
    closeDeleteModal();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

    // Créer l'objet busSchedule si au moins une période est cochée
    const busSchedule =
      formData.scheduleMorning || formData.scheduleMidday || formData.scheduleEvening
        ? {
            morning: formData.scheduleMorning,
            midday: formData.scheduleMidday,
            evening: formData.scheduleEvening,
          }
        : undefined;

    if (editingStudentId) {
      // Mode édition
      const updateData: studentApi.StudentUpdateInput = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        grade: formData.grade,
        commune: formData.commune || undefined,
        quartier: formData.quartier || undefined,
        busId: formData.busId || null,
        busSchedule,
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
        busId: formData.busId || undefined,
        busSchedule,
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

        <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="zone-filter">
                Zone (Commune ou Quartier)
              </label>
              <input
                id="zone-filter"
                type="text"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                placeholder="Commune, quartier..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="grade-filter">
                Classe
              </label>
              <select
                id="grade-filter"
                name="gradeFilter"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              >
                <option value="">Toutes les classes</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="bus-filter">
                Bus
              </label>
              <select
                id="bus-filter"
                name="busFilter"
                value={busFilter}
                onChange={(e) => setBusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
              >
                <option value="">Tous les bus</option>
                {buses?.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.number} - {bus.chauffeur}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
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
          <>
            {filteredStudents.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
                <div className="px-6 py-10 text-sm text-center text-slate-500">
                  Aucun élève ne correspond aux filtres appliqués pour le moment.
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Bus
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Élève
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Classe
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Date de naissance
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Adresse
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudents.map((student) => {
                      const bus = buses?.find((b) => b.id === student.busId);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 align-top">
                            {student.busId ? (
                              <div className="space-y-1">
                                <div className="text-sm font-semibold bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-1 rounded-md inline-block">
                                  {bus?.number || `Bus ${student.busId.substring(0, 8)}`}
                                </div>
                                {student.busSchedule && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {student.busSchedule.morning && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                                        Matin
                                      </span>
                                    )}
                                    {student.busSchedule.midday && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded">
                                        Midi
                                      </span>
                                    )}
                                    {student.busSchedule.evening && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                                        Soir
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">Non assigné</span>
                            )}
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {student.firstName} {student.lastName}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  student.isActive
                                    ? 'bg-success-50 text-success-700 border-success-200'
                                    : 'bg-danger-50 text-danger-700 border-danger-200'
                                }`}
                              >
                                {student.isActive ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {student.commune || 'Commune non renseignée'}
                              {student.quartier ? ` · ${student.quartier}` : ''}
                            </div>
                            {student.specialNeeds && (
                              <div className="flex items-center gap-1 text-xs text-warning-700 mt-2">
                                <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                                <span>Besoins spéciaux</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">{student.grade}</td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {student.pickupLocation?.address || 'Adresse non renseignée'}
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
                                onClick={() => openDeleteModal(student)}
                                className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" strokeWidth={2} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
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

                  {/* Section assignation bus */}
                  <div className="col-span-2 border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Bus className="w-4 h-4 text-slate-600" strokeWidth={2} />
                      <h4 className="font-semibold text-slate-800">Assignation Transport</h4>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bus assigné
                    </label>
                    <select
                      name="busId"
                      value={formData.busId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    >
                      <option value="">Aucun bus (non assigné)</option>
                      {buses?.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.number} - {bus.immatriculation} ({bus.chauffeur})
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.busId && (
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Périodes de transport
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            name="scheduleMorning"
                            checked={formData.scheduleMorning}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Matin</span>
                        </label>

                        <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            name="scheduleMidday"
                            checked={formData.scheduleMidday}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Midi</span>
                        </label>

                        <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            name="scheduleEvening"
                            checked={formData.scheduleEvening}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Soir</span>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Sélectionnez les périodes pendant lesquelles l'élève prend le bus
                      </p>
                    </div>
                  )}

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

        {studentToDelete && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-danger-500" strokeWidth={2} />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Confirmer la suppression de {studentToDelete.firstName} {studentToDelete.lastName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Cette action est irréversible et supprimera définitivement les données de l'élève.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Annuler la suppression
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2.5 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-all text-sm font-medium shadow-md disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Suppression...' : 'Supprimer l\'élève'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
