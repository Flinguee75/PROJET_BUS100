/**
 * Cloud Function Trigger - Création automatique du document utilisateur
 * Se déclenche automatiquement quand un utilisateur est créé dans Firebase Auth
 */

import * as functions from 'firebase-functions/v1';
import { getDb } from '../config/firebase.config';
import { UserRecord } from 'firebase-functions/v1/auth';

/**
 * Trigger qui s'exécute automatiquement à chaque création d'utilisateur
 * Crée le document Firestore correspondant dans la collection /users
 */
export const onUserCreated = functions
  .region('europe-west4')
  .auth.user()
  .onCreate(async (user: UserRecord) => {
    try {
      console.log(`📝 Création du document Firestore pour ${user.email}`);

      const userData = {
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Utilisateur',
        role: 'admin', // Par défaut, à ajuster selon vos besoins
        phoneNumber: user.phoneNumber || '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await getDb().collection('users').doc(user.uid).set(userData);

      console.log(`✅ Document Firestore créé avec succès pour ${user.email}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Rôle: ${userData.role}`);
    } catch (error) {
      console.error('❌ Erreur lors de la création du document utilisateur:', error);
      // Ne pas lancer d'erreur pour ne pas bloquer la création du compte Auth
    }
  });
