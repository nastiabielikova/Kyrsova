// Debug endpoint для перевірки env змінних та Firebase
module.exports = (req, res) => {
  const admin = require('firebase-admin');
  
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    hasFirebaseBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    hasFirebaseJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    firebaseAppsCount: admin.apps.length,
    timestamp: new Date().toISOString()
  };
  
  console.log('🔍 Debug endpoint called:', envCheck);
  
  // Спробуємо ініціалізувати Firebase якщо не ініціалізовано
  if (admin.apps.length === 0) {
    try {
      const { initializeFirebase } = require('../server/config/firebase');
      initializeFirebase();
      envCheck.firebaseInitAttempt = 'success';
      envCheck.firebaseAppsCount = admin.apps.length;
    } catch (error) {
      envCheck.firebaseInitAttempt = 'failed';
      envCheck.firebaseError = error.message;
      envCheck.firebaseStack = error.stack;
    }
  }
  
  res.json(envCheck);
};
