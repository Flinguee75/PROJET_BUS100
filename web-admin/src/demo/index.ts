/**
 * Point d'entrée du MODE DÉMO.
 *
 * Importé par les services de données : quand `IS_DEMO` est vrai, ils renvoient
 * les données simulées (`demoSim`) au lieu d'appeler Firebase.
 */

export { IS_DEMO, isDemoMode } from './config';
export { demoSim, DEMO_SCHOOL, DEMO_USER } from './simulation';
