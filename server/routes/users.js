const express = require("express");
const router = express.Router();
const { getDb } = require("../config/firebase");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

/**
 * GET /api/users/profile
 * Отримання профілю поточного користувача
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection("users").doc(req.user.uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Профіль користувача не знайдено" });
    }

    const userData = doc.data();
    // Не повертаємо конфіденційну інформацію
    delete userData.password;

    res.json({ id: doc.id, ...userData });
  } catch (error) {
    console.error("Помилка отримання профілю:", error);
    res.status(500).json({ error: "Помилка отримання профілю" });
  }
});

/**
 * PUT /api/users/profile
 * Оновлення профілю користувача
 */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection("users").doc(req.user.uid);

    const allowedFields = [
      "displayName",
      "phoneNumber",
      "address",
      "dateOfBirth",
    ];
    const updateData = {};

    // Фільтруємо дозволені поля
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    updateData.updatedAt = new Date().toISOString();

    await docRef.update(updateData);

    res.json({
      message: "Профіль успішно оновлено",
      ...updateData,
    });
  } catch (error) {
    console.error("Помилка оновлення профілю:", error);
    res.status(500).json({ error: "Помилка оновлення профілю" });
  }
});

/**
 * GET /api/users
 * Отримання списку всіх користувачів (тільки для адміністраторів)
 */
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection("users").get();
    const users = [];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      delete userData.password;
      users.push({ id: doc.id, ...userData });
    });

    res.json(users);
  } catch (error) {
    console.error("Помилка отримання користувачів:", error);
    res.status(500).json({ error: "Помилка отримання користувачів" });
  }
});

/**
 * PUT /api/users/:id/role
 * Зміна ролі користувача (тільки для адміністраторів)
 */
router.put("/:id/role", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Невалідна роль" });
    }

    const docRef = db.collection("users").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Користувача не знайдено" });
    }

    await docRef.update({
      role,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      message: "Роль користувача оновлено",
      role,
    });
  } catch (error) {
    console.error("Помилка зміни ролі:", error);
    res.status(500).json({ error: "Помилка зміни ролі" });
  }
});

module.exports = router;
