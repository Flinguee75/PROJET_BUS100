/**
 * Fonction de test simple pour vérifier le chargement
 */

import { onRequest } from 'firebase-functions/v2/https';

export const helloWorld = onRequest(
  {
    region: 'europe-west4',
  },
  (_req, res) => {
    res.json({ message: 'Hello from Firebase!' });
  }
);
