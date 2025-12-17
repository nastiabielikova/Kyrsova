const express = require("express");
const router = express.Router();
const { getDb } = require("../config/firebase");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

/**
 * GET /api/orders
 * Отримання замовлень (всі для адміна, свої для користувача)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;

    // Перевіряємо чи користувач адміністратор
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = userDoc.exists && userDoc.data().role === "admin";

    let query = db.collection("orders");

    // Якщо не адмін - показуємо тільки свої замовлення
    if (!isAdmin) {
      query = query.where("userId", "==", req.user.uid);
    }

    // Фільтр за статусом
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const orders = [];

    snapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    res.json(orders);
  } catch (error) {
    console.error("Помилка отримання замовлень:", error);
    res.status(500).json({ error: "Помилка отримання замовлень" });
  }
});

/**
 * GET /api/orders/:id
 * Отримання конкретного замовлення
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection("orders").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const orderData = doc.data();

    // Перевіряємо права доступу
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = userDoc.exists && userDoc.data().role === "admin";

    if (!isAdmin && orderData.userId !== req.user.uid) {
      return res.status(403).json({ error: "Доступ заборонено" });
    }

    res.json({ id: doc.id, ...orderData });
  } catch (error) {
    console.error("Помилка отримання замовлення:", error);
    res.status(500).json({ error: "Помилка отримання замовлення" });
  }
});

/**
 * POST /api/orders
 * Створення нового замовлення
 */
router.post(
  "/",
  authMiddleware,
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Замовлення повинно містити хоча б один товар"),
    body("deliveryAddress")
      .notEmpty()
      .withMessage("Адреса доставки обов'язкова"),
    body("phoneNumber").notEmpty().withMessage("Номер телефону обов'язковий"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = getDb();
      const { items, deliveryAddress, phoneNumber, notes } = req.body;

      // Перевіряємо наявність товарів та обчислюємо загальну суму
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const medicineDoc = await db
          .collection("medicines")
          .doc(item.medicineId)
          .get();

        if (!medicineDoc.exists) {
          return res.status(404).json({
            error: `Медикамент ${item.medicineId} не знайдено`,
          });
        }

        const medicine = medicineDoc.data();

        // Перевіряємо наявність достатньої кількості
        if (medicine.quantity < item.quantity) {
          return res.status(400).json({
            error: `Недостатня кількість товару ${medicine.name}. Доступно: ${medicine.quantity}`,
          });
        }

        const itemTotal = medicine.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          medicineId: item.medicineId,
          name: medicine.name,
          price: medicine.price,
          quantity: item.quantity,
          total: itemTotal,
        });
      }

      // Створюємо замовлення
      const orderData = {
        userId: req.user.uid,
        userEmail: req.user.email,
        items: orderItems,
        totalAmount,
        deliveryAddress,
        phoneNumber,
        notes: notes || "",
        status: "pending", // pending, confirmed, processing, shipped, delivered, cancelled
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await db.collection("orders").add(orderData);

      // Оновлюємо кількість товарів
      const batch = db.batch();
      for (const item of items) {
        const medicineRef = db.collection("medicines").doc(item.medicineId);
        const medicineDoc = await medicineRef.get();
        const newQuantity = medicineDoc.data().quantity - item.quantity;
        batch.update(medicineRef, { quantity: newQuantity });
      }
      await batch.commit();

      res.status(201).json({
        id: docRef.id,
        ...orderData,
        message: "Замовлення успішно створено",
      });
    } catch (error) {
      console.error("Помилка створення замовлення:", error);
      res.status(500).json({ error: "Помилка створення замовлення" });
    }
  },
);

/**
 * PUT /api/orders/:id/status
 * Оновлення статусу замовлення (тільки для адміністраторів)
 */
router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  [
    body("status")
      .isIn([
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ])
      .withMessage("Невалідний статус"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = getDb();
      const docRef = db.collection("orders").doc(req.params.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Замовлення не знайдено" });
      }

      await docRef.update({
        status: req.body.status,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        id: req.params.id,
        status: req.body.status,
        message: "Статус замовлення оновлено",
      });
    } catch (error) {
      console.error("Помилка оновлення статусу:", error);
      res.status(500).json({ error: "Помилка оновлення статусу" });
    }
  },
);

/**
 * DELETE /api/orders/:id
 * Скасування замовлення
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection("orders").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Замовлення не знайдено" });
    }

    const orderData = doc.data();

    // Перевіряємо права доступу
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const isAdmin = userDoc.exists && userDoc.data().role === "admin";

    if (!isAdmin && orderData.userId !== req.user.uid) {
      return res.status(403).json({ error: "Доступ заборонено" });
    }

    // Можна скасувати тільки замовлення зі статусом pending
    if (orderData.status !== "pending") {
      return res.status(400).json({
        error: 'Можна скасувати тільки замовлення зі статусом "В очікуванні"',
      });
    }

    // Повертаємо товари на склад
    const batch = db.batch();
    for (const item of orderData.items) {
      const medicineRef = db.collection("medicines").doc(item.medicineId);
      const medicineDoc = await medicineRef.get();
      if (medicineDoc.exists) {
        const newQuantity = medicineDoc.data().quantity + item.quantity;
        batch.update(medicineRef, { quantity: newQuantity });
      }
    }

    // Оновлюємо статус на скасовано
    batch.update(docRef, {
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();

    res.json({ message: "Замовлення скасовано" });
  } catch (error) {
    console.error("Помилка скасування замовлення:", error);
    res.status(500).json({ error: "Помилка скасування замовлення" });
  }
});

module.exports = router;
