/**
 * API Service Student - Opérations CRUD pour les élèves
 * Utilise axios avec authentification automatique
 */

import api from './gps.api';

export interface Location {
  address: string;
  lat: number;
  lng: number;
  notes?: string;
}

export interface StudentCreateInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO string
  grade: string;
  parentIds: string[];
  commune: string;
  quartier: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  specialNeeds?: string;
}

export interface StudentUpdateInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  grade?: string;
  commune?: string;
  quartier?: string;
  busId?: string | null;
  routeId?: string | null;
  pickupLocation?: Location;
  dropoffLocation?: Location;
  specialNeeds?: string;
  isActive?: boolean;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  grade: string;
  parentIds: string[];
  commune: string;
  quartier: string;
  busId: string | null;
  routeId: string | null;
  pickupLocation: Location;
  dropoffLocation: Location;
  photoUrl?: string;
  specialNeeds?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Crée un nouvel élève
 */
export const createStudent = async (data: StudentCreateInput): Promise<Student> => {
  try {
    const response = await api.post('/api/students', data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error creating student:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la création de l\'élève'
    );
  }
};

/**
 * Récupère tous les élèves
 */
export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const response = await api.get('/api/students');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching students:', error);
    throw new Error('Erreur lors de la récupération des élèves');
  }
};

/**
 * Récupère les élèves d'un parent
 */
export const getStudentsByParent = async (parentId: string): Promise<Student[]> => {
  try {
    const response = await api.get(`/api/students?parentId=${parentId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching students by parent:', error);
    throw new Error('Erreur lors de la récupération des élèves du parent');
  }
};

/**
 * Récupère les élèves d'un bus
 */
export const getStudentsByBus = async (busId: string): Promise<Student[]> => {
  try {
    const response = await api.get(`/api/students?busId=${busId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching students by bus:', error);
    throw new Error('Erreur lors de la récupération des élèves du bus');
  }
};

/**
 * Récupère un élève par son ID
 */
export const getStudentById = async (id: string): Promise<Student> => {
  try {
    const response = await api.get(`/api/students/${id}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching student:', error);
    throw new Error('Élève introuvable');
  }
};

/**
 * Met à jour un élève existant
 */
export const updateStudent = async (
  id: string,
  data: StudentUpdateInput
): Promise<Student> => {
  try {
    const response = await api.patch(`/api/students/${id}`, data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error updating student:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la mise à jour de l\'élève'
    );
  }
};

/**
 * Supprime un élève (soft delete)
 */
export const deleteStudent = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/students/${id}`);
  } catch (error: unknown) {
    console.error('Error deleting student:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la suppression de l\'élève'
    );
  }
};

/**
 * Assigne un élève à un bus
 */
export const assignStudentToBus = async (
  studentId: string,
  busId: string,
  routeId: string
): Promise<Student> => {
  try {
    const response = await api.post(`/api/students/${studentId}/assign-bus`, {
      busId,
      routeId,
    });
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error assigning student to bus:', error);
    throw new Error('Erreur lors de l\'assignation de l\'élève au bus');
  }
};

/**
 * Retire un élève d'un bus
 */
export const removeStudentFromBus = async (studentId: string): Promise<Student> => {
  try {
    const response = await api.post(`/api/students/${studentId}/remove-bus`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error removing student from bus:', error);
    throw new Error('Erreur lors du retrait de l\'élève du bus');
  }
};

