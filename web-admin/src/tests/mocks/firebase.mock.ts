/**
 * Mocks pour Firebase
 */

import { vi } from 'vitest';

// Mock Firebase Auth
export const mockSignInWithEmailAndPassword = vi.fn();
export const mockSignOut = vi.fn();
export const mockOnAuthStateChanged = vi.fn();

export const mockAuth = {
  currentUser: null,
};

// Mock Firestore
export const mockGetDoc = vi.fn();
export const mockOnSnapshot = vi.fn();
export const mockCollection = vi.fn();
export const mockQuery = vi.fn();
export const mockDoc = vi.fn();

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: mockDoc,
  getDoc: mockGetDoc,
  collection: mockCollection,
  query: mockQuery,
  onSnapshot: mockOnSnapshot,
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

