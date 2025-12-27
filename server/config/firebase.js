const admin = require("firebase-admin");
require("dotenv").config();

/**
 * Ініціалізація Firebase Admin SDK
 * Використовується для автентифікації та доступу до бази даних
 */
const initializeFirebase = () => {
  try {
    // Перевіряємо, чи вже ініціалізовано (важливо для serverless)
    if (admin.apps.length > 0) {
      console.log("✅ Firebase вже ініціалізовано");
      return;
    }

    // Якщо використовується GOOGLE_APPLICATION_CREDENTIALS (дефолтний спосіб)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
      console.log(
        "✅ Firebase підключено через GOOGLE_APPLICATION_CREDENTIALS",
      );
      return;
    }

    // Якщо передано JSON рядок з налаштуваннями serviceAccount
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        console.log("📦 Використано FIREBASE_SERVICE_ACCOUNT_JSON");
      } catch (err) {
        console.warn(
          "⚠️ Невалідний FIREBASE_SERVICE_ACCOUNT_JSON; спробую інші опції.",
        );
      }
    }

    // Якщо передано BASE64 JSON
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        const decoded = Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
          "base64",
        ).toString("utf8");
        serviceAccount = JSON.parse(decoded);
        console.log("📦 Використано FIREBASE_SERVICE_ACCOUNT_BASE64");
      } catch (err) {
        console.error(
          "❌ Невалідний FIREBASE_SERVICE_ACCOUNT_BASE64:",
          err.message,
        );
      }
    }

    // Якщо не передано JSON, беремо значення з окремих ENV
    if (!serviceAccount) {
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error(
          "Firebase credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_BASE64 or individual FIREBASE_* env vars",
        );
      }
      
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };
      console.log("📦 Використано окремі FIREBASE_* змінні");
    }

    // Узгоджуємо властивості privateKey / private_key для сумісності
    if (
      serviceAccount &&
      serviceAccount.privateKey &&
      !serviceAccount.private_key
    ) {
      serviceAccount.private_key = serviceAccount.privateKey;
    }
    if (
      serviceAccount &&
      serviceAccount.private_key &&
      !serviceAccount.privateKey
    ) {
      serviceAccount.privateKey = serviceAccount.private_key;
    }

    // Ініціалізуємо через сертифікат
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log("✅ Firebase успішно підключено");
    console.log(`📍 Project ID: ${serviceAccount.projectId || serviceAccount.project_id}`);
  } catch (error) {
    console.error("❌ Помилка підключення Firebase:", error.message);
    console.error("Stack:", error.stack);
    // В serverless середовищі не використовуємо process.exit(1)
    throw error;
  }
};

/**
 * Отримання посилання на Firestore базу даних
 */
const getDb = () => {
  return admin.firestore();
};

/**
 * Перевірка токену автентифікації
 */
const verifyToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error("Невалідний токен автентифікації");
  }
};

module.exports = {
  initializeFirebase,
  getDb,
  verifyToken,
  admin,
};
