const express = require("express");
const router = express.Router();
const { getDb } = require("../config/firebase");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

/**
 * GET /api/pharmacies
 * Отримання списку всіх аптек
 */
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    
    if (!db) {
      console.error("❌ Firebase DB не ініціалізовано");
      return res.status(500).json({ 
        error: "Помилка підключення до бази даних",
        details: "Firebase не ініціалізовано" 
      });
    }
    
    const snapshot = await db.collection("pharmacies").orderBy("name").get();
    
    const pharmacies = [];
    snapshot.forEach((doc) => {
      pharmacies.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(pharmacies);
  } catch (error) {
    console.error("❌ Помилка отримання аптек:", error);
    res.status(500).json({ 
      error: "Помилка отримання списку аптек",
      details: error.message 
    });
  }
});

/**
 * GET /api/pharmacies/:id
 * Отримання інформації про конкретну аптеку
 */
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection("pharmacies").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Аптека не знайдена" });
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    console.error("Помилка отримання аптеки:", error);
    res.status(500).json({ error: "Помилка отримання інформації про аптеку" });
  }
});

/**
 * POST /api/pharmacies
 * Створення нової аптеки (лише для адміністраторів)
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  [
    body("name").notEmpty().withMessage("Назва аптеки обов'язкова"),
    body("address").notEmpty().withMessage("Адреса обов'язкова"),
    body("city").notEmpty().withMessage("Місто обов'язкове"),
    body("phone").notEmpty().withMessage("Телефон обов'язковий"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = getDb();
      const { name, address, city, phone, email, workingHours, description } = req.body;

      const newPharmacy = {
        name,
        address,
        city,
        phone,
        email: email || "",
        workingHours: workingHours || "9:00 - 21:00",
        description: description || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await db.collection("pharmacies").add(newPharmacy);

      res.status(201).json({
        id: docRef.id,
        ...newPharmacy,
        message: "Аптека успішно створена",
      });
    } catch (error) {
      console.error("Помилка створення аптеки:", error);
      res.status(500).json({ error: "Помилка створення аптеки" });
    }
  }
);

/**
 * PUT /api/pharmacies/:id
 * Оновлення інформації про аптеку (лише для адміністраторів)
 */
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const db = getDb();
      const docRef = db.collection("pharmacies").doc(req.params.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Аптека не знайдена" });
      }

      const { name, address, city, phone, email, workingHours, description } = req.body;

      const updatedData = {
        ...(name && { name }),
        ...(address && { address }),
        ...(city && { city }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(workingHours && { workingHours }),
        ...(description !== undefined && { description }),
        updatedAt: new Date().toISOString(),
      };

      await docRef.update(updatedData);

      const updatedDoc = await docRef.get();

      res.json({
        id: updatedDoc.id,
        ...updatedDoc.data(),
        message: "Аптека успішно оновлена",
      });
    } catch (error) {
      console.error("Помилка оновлення аптеки:", error);
      res.status(500).json({ error: "Помилка оновлення аптеки" });
    }
  }
);

/**
 * DELETE /api/pharmacies/:id
 * Видалення аптеки (лише для адміністраторів)
 */
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const db = getDb();
      const docRef = db.collection("pharmacies").doc(req.params.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Аптека не знайдена" });
      }

      await docRef.delete();

      res.json({ message: "Аптека успішно видалена" });
    } catch (error) {
      console.error("Помилка видалення аптеки:", error);
      res.status(500).json({ error: "Помилка видалення аптеки" });
    }
  }
);

module.exports = router;
