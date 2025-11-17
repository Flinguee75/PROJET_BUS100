/**
 * Script pour créer le document Firestore pour votre utilisateur
 */

const admin = require('firebase-admin');

// Initialiser Firebase Admin
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'projet-bus-60a3f'
});

const db = admin.firestore();

// VOS INFORMATIONS (depuis users.json)
const UID = 'WZXQ0GXK8PShj9ux8wTXamZx2tY2';
const EMAIL = 'redfoo932@gmail.com';

async function createUserDocument() {
  try {
    console.log('📝 Création du document utilisateur...\n');
    
    const userData = {
      email: EMAIL,
      displayName: 'Admin', // Vous pouvez changer ce nom
      role: 'admin',
      phoneNumber: '',
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await db.collection('users').doc(UID).set(userData);
    
    console.log('✅ Document Firestore créé avec succès!\n');
    console.log('📄 Données créées:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('\n🎉 Vous pouvez maintenant vous connecter au dashboard!');
    console.log(`📧 Email: ${EMAIL}`);
    console.log('🔑 Mot de passe: celui que vous avez défini dans Firebase Auth\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createUserDocument();

