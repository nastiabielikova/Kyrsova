const admin = require("firebase-admin");
require("dotenv").config();

/**
 * Ініціалізація Firebase Admin SDK
 * Використовується для автентифікації та доступу до бази даних
 */
const initializeFirebase = () => {
  try {
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
      } catch (err) {
        console.warn(
          "Невалідний FIREBASE_SERVICE_ACCOUNT_JSON; спробую інші опції.",
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
      } catch (err) {
        console.warn(
          "Невалідний FIREBASE_SERVICE_ACCOUNT_BASE64; спробую інші опції.",
        );
      }
    }

    // Якщо не передано JSON, беремо значення з окремих ENV
    if (!serviceAccount) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };
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
  } catch (error) {
    console.error("❌ Помилка підключення Firebase:", error.message);
    process.exit(1);
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
