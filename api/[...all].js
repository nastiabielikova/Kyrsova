const serverless = require('serverless-http');
const app = require('../server/server');

console.log('🚀 Serverless function initialized');
console.log('📦 Available env vars:', {
  hasFirebaseBase64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  hasFirebaseJson: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
  nodeEnv: process.env.NODE_ENV
});

module.exports = serverless(app);
