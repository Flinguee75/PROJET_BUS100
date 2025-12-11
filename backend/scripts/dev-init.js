#!/usr/bin/env node

/**
 * Script d'initialisation de l'environnement de développement
 * Lance les émulateurs, seed la base de données et crée un utilisateur
 */

const { spawn } = require('child_process');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
};

let emulatorProcess = null;

// Fonction pour vérifier si un port est ouvert
function checkPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const options = {
      host,
      port,
      timeout: 1000,
    };

    const req = http.request(options, () => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Fonction pour attendre que les émulateurs soient prêts
async function waitForEmulators(maxWaitSeconds = 60) {
  log.info('⏳ Attente du démarrage des émulateurs...');
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    const isReady = await checkPort(8080); // Port Firestore UI
    if (isReady) {
      log.success('✅ Émulateurs démarrés');
      // Attendre encore 3 secondes pour s'assurer que tout est prêt
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return true;
    }
    process.stdout.write('.');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  log.error('❌ Timeout: les émulateurs n\'ont pas démarré');
  return false;
}

// Fonction pour exécuter une commande npm
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn('npm', ['run', command, ...args], {
      stdio: 'inherit',
      shell: true,
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Fonction de nettoyage
function cleanup() {
  log.warning('\n🛑 Arrêt des émulateurs...');
  if (emulatorProcess) {
    emulatorProcess.kill();
  }
  process.exit(0);
}

// Capturer CTRL+C
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Fonction principale
async function main() {
  try {
    console.log('🚀 Initialisation de l\'environnement de développement...\n');

    // Build du projet
    log.info('📦 Build du projet...');
    await runCommand('build');

    // Lancer les émulateurs en arrière-plan
    log.info('🔧 Lancement des émulateurs Firebase...');
    emulatorProcess = spawn(
      'firebase',
      [
        'emulators:start',
        '--only',
        'functions,firestore,auth',
        '--project',
        'projet-bus-60a3f',
      ],
      {
        stdio: 'pipe', // Ne pas afficher les logs tout de suite
        shell: true,
      }
    );

    // Attendre que les émulateurs soient prêts
    const emulatorsReady = await waitForEmulators();
    if (!emulatorsReady) {
      cleanup();
      return;
    }

    // Lancer le seed
    log.info('\n🌱 Seed de la base de données...');
    await runCommand('seed');
    log.success('✅ Seed terminé');

    // Créer l'utilisateur
    log.info('👤 Création de l\'utilisateur...');
    await runCommand('create-user-emulator');
    log.success('✅ Utilisateur créé');

    // Afficher le message de succès
    log.success('\n🎉 Environnement prêt !');
    log.info('Les émulateurs continuent de tourner...');
    log.warning('Appuyez sur CTRL+C pour arrêter\n');

    // Afficher les logs des émulateurs
    emulatorProcess.stdout.pipe(process.stdout);
    emulatorProcess.stderr.pipe(process.stderr);

    // Garder le script actif
    await new Promise(() => {});
  } catch (error) {
    log.error(`❌ Erreur: ${error.message}`);
    cleanup();
  }
}

main();
