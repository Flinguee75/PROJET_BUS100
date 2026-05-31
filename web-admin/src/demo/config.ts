/**
 * Configuration du MODE DÉMO
 *
 * Le mode démo permet de faire tourner le dashboard **sans backend ni Firebase**,
 * avec des bus simulés qui se déplacent vers l'école en temps réel.
 * Idéal pour des présentations / démos en école sans connexion ni secrets.
 *
 * Règle d'activation :
 *   - ACTIVÉ si `VITE_DEMO_MODE=true` (forçage explicite)
 *   - ACTIVÉ automatiquement si Firebase n'est PAS entièrement configuré
 *   - TOUJOURS désactivé pendant les tests (les tests fournissent une config Firebase complète)
 *
 * Conséquence pratique :
 *   - Un clone frais sans `.env` → `npm run dev` fonctionne tout seul (données simulées).
 *   - Dès qu'on fournit une config Firebase complète (et sans forçage), on bascule en réel.
 */

const env = import.meta.env;

const isTestEnv = env.MODE === 'test' || Boolean((env as Record<string, unknown>).VITEST);

const firebaseFullyConfigured = Boolean(
  env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_AUTH_DOMAIN &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_STORAGE_BUCKET &&
    env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    env.VITE_FIREBASE_APP_ID
);

const demoForced = env.VITE_DEMO_MODE === 'true';

/** `true` quand l'application doit utiliser les données simulées. */
export const IS_DEMO: boolean = !isTestEnv && (demoForced || !firebaseFullyConfigured);

/** Helper fonctionnel (évite la capture de la valeur au moment de l'import dans certains cas). */
export const isDemoMode = (): boolean => IS_DEMO;

/** Cadence de rafraîchissement de la simulation (ms).
 *  Choisie courte pour que l'animation des marqueurs paraisse continue
 *  sans dépendre d'un filtre Kalman côté carte en mode démo. */
export const DEMO_TICK_MS = 250;

/** Durée approximative d'une tournée complète simulée (ms). */
export const DEMO_TRIP_DURATION_MS = 90_000;

/** Temps d'attente à l'école avant qu'un bus reparte pour une nouvelle tournée (ms). */
export const DEMO_DWELL_AT_SCHOOL_MS = 25_000;

/** Temps d'arrêt simulé à chaque arrêt élève (ms). Mis à l'échelle par speedMultiplier. */
export const DEMO_STOP_DWELL_MS = 5_000;
