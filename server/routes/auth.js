const express = require("express");
const router = express.Router();
const { getDb, admin } = require("../config/firebase");
const { body, validationResult } = require("express-validator");

/**
 * POST /api/auth/register
 * Реєстрація нового користувача
 */
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Невалідна email адреса"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Пароль має містити мінімум 6 символів"),
    body("displayName").notEmpty().withMessage("Ім'я обов'язкове"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, displayName, phoneNumber } = req.body;

      let userRecord;

      // Перевіряємо, чи вже існує користувач з таким email
      try {
        const existingUser = await admin.auth().getUserByEmail(email);
        if (existingUser) {
          // Користувач вже існує у Firebase, створюємо або оновлюємо Firestore документ
          userRecord = existingUser;
        }
      } catch (err) {
        // Якщо помилка не 'auth/user-not-found', то прокидаємо її далі
        if (err.code && err.code !== "auth/user-not-found") {
          throw err;
        }

        // Користувача немає, створюємо його
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName,
        });
      }

      // Зберігаємо або оновлюємо додаткову інформацію в Firestore
      const db = getDb();
      const userRef = db.collection("users").doc(userRecord.uid);
      const userDoc = await userRef.get();

      const timestamps = {
        updatedAt: new Date().toISOString(),
      };

      // Якщо немає createdAt (старі акаунти) — додаємо його
      if (!userDoc.exists || !userDoc.data().createdAt) {
        timestamps.createdAt = new Date().toISOString();
      }

      await userRef.set(
        {
          email,
          displayName,
          phoneNumber: phoneNumber || "",
          role: "user", // За замовчуванням роль користувача
          ...timestamps,
        },
        { merge: true },
      );

      res.status(201).json({
        message: "Користувача успішно зареєстровано",
        uid: userRecord.uid,
        email: userRecord.email,
      });
    } catch (error) {
      console.error("Помилка реєстрації:", error);

      if (error.code === "auth/email-already-exists") {
        return res
          .status(400)
          .json({ error: "Користувач з таким email вже існує" });
      }

      res.status(500).json({ error: "Помилка реєстрації користувача" });
    }
  },
);

/**
 * POST /api/auth/verify-token
 * Перевірка валідності токену
 */
router.post("/verify-token", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Токен не надано" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);

    // Отримуємо додаткову інформацію про користувача
    const db = getDb();
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }

    const userData = userDoc.data();
    delete userData.password;

    res.json({
      valid: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...userData,
      },
    });
  } catch (error) {
    console.error("Помилка перевірки токену:", error);
    res.status(401).json({
      valid: false,
      error: "Невалідний токен",
    });
  }
});

module.exports = router;
