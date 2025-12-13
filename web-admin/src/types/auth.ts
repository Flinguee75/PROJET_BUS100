/**
 * Types pour l'authentification
 */

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  schoolId?: string | null;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  DAF = 'DAF',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
