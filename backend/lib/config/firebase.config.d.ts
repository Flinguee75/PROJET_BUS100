import * as admin from 'firebase-admin';
export declare function getDb(): admin.firestore.Firestore;
export declare function getAuth(): admin.auth.Auth;
export declare function getMessaging(): admin.messaging.Messaging;
export declare function getStorage(): admin.storage.Storage;
export declare const db: admin.firestore.Firestore;
export declare const auth: admin.auth.Auth;
export declare const messaging: admin.messaging.Messaging;
export declare const storage: admin.storage.Storage;
export declare const collections: {
    buses: string;
    students: string;
    drivers: string;
    parents: string;
    admins: string;
    users: string;
    schools: string;
    gpsLive: string;
    gpsHistory: string;
    notifications: string;
    routes: string;
    attendance: string;
    fcmTokens: string;
};
export default admin;
//# sourceMappingURL=firebase.config.d.ts.map