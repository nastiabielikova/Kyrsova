const express = require("express");
const router = express.Router();
const { getDb } = require("../config/firebase");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Налаштування для завантаження інструкцій
const instructionsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, "../public/instructions");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const uploadInstruction = multer({
  storage: instructionsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx|txt/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Дозволені лише файли інструкцій: PDF, DOC, DOCX, TXT"
        )
      );
    }
  },
});

// Helper — чи це "scenic" / lifestyle зображення
function isScenicUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    const badHosts = [
      "images.unsplash.com",
      "unsplash.com",
      "images.pexels.com",
      "pexels.com",
      "cdn.pixabay.com",
      "pixabay.com",
    ];
    for (const h of badHosts) if (hostname.includes(h)) return true;
    const path = (u.pathname || "").toLowerCase();
    const scenicKeywords = [
      "villa",
      "house",
      "pool",
      "beach",
      "apartment",
      "resort",
      "interior",
      "exterior",
      "hotel",
      "livingroom",
      "kitchen",
      "bedroom",
      "real-estate",
    ];
    for (const k of scenicKeywords) if (path.includes(k)) return true;
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * POST /api/medicines/replace-scenic
 * Адмінська дія - замінити "scenic" зовнішні зображення на локальний fallback
 */
router.post(
  "/replace-scenic",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const db = getDb();
      const SERVER_HOST =
        process.env.SERVER_HOST || `${req.protocol}://${req.get("host")}`;
      const fallbackUrl = `${SERVER_HOST}/images/meds/fallback.jpg`;
      const snapshot = await db.collection("medicines").get();
      let updated = 0;
      for (const doc of snapshot.docs) {
        const d = doc.data();
        const current = d.imageUrl;
        if (
          current &&
          isScenicUrl(current) &&
          !current.startsWith(SERVER_HOST)
        ) {
          await doc.ref.update({
            imageUrl: fallbackUrl,
            updatedAt: new Date().toISOString(),
          });
          updated++;
        }
      }
      res.json({ updated });
    } catch (error) {
      console.error("Помилка при replace-scenic:", error);
      res.status(500).json({ error: "Помилка при replace-scenic" });
    }
  },
);

// (getDb, authMiddleware, adminMiddleware already imported at top)
const { body, validationResult } = require("express-validator");

/**
 * GET /api/medicines
 * Отримання списку всіх медикаментів
 */
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const { category, search, inStock } = req.query;

    let query = db.collection("medicines");

    // Фільтр за категорією
    if (category) {
      query = query.where("category", "==", category);
    }

    // Фільтр за наявністю
    if (inStock === "true") {
      query = query.where("quantity", ">", 0);
    }

    const snapshot = await query.get();
    let medicines = [];

    snapshot.forEach((doc) => {
      medicines.push({ id: doc.id, ...doc.data() });
    });

    // Пошук за назвою (локально, бо Firestore не підтримує повнотекстовий пошук)
    if (search) {
      const searchLower = search.toLowerCase();
      medicines = medicines.filter(
        (med) =>
          med.name.toLowerCase().includes(searchLower) ||
          med.description?.toLowerCase().includes(searchLower),
      );
    }

    res.json(medicines);
  } catch (error) {
    console.error("Помилка отримання медикаментів:", error);
    res.status(500).json({ error: "Помилка отримання медикаментів" });
  }
});

/**
 * GET /api/medicines/:id
 * Отримання конкретного медикаменту за ID
 */
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection("medicines").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Медикамент не знайдено" });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Помилка отримання медикаменту:", error);
    res.status(500).json({ error: "Помилка отримання медикаменту" });
  }
});

/**
 * POST /api/medicines
 * Створення нового медикаменту (тільки для адміністраторів)
 */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  [
    body("name").notEmpty().withMessage("Назва обов'язкова"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Ціна має бути позитивним числом"),
    body("quantity")
      .isInt({ min: 0 })
      .withMessage("Кількість має бути цілим числом"),
    body("category").notEmpty().withMessage("Категорія обов'язкова"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const db = getDb();
      const medicineData = {
        name: req.body.name,
        description: req.body.description || "",
        price: parseFloat(req.body.price),
        quantity: parseInt(req.body.quantity),
        category: req.body.category,
        manufacturer: req.body.manufacturer || "",
        expirationDate: req.body.expirationDate || null,
        prescription: req.body.prescription || false,
        imageUrl: req.body.imageUrl || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await db.collection("medicines").add(medicineData);

      res.status(201).json({
        id: docRef.id,
        ...medicineData,
        message: "Медикамент успішно створено",
      });
    } catch (error) {
      console.error("Помилка створення медикаменту:", error);
      res.status(500).json({ error: "Помилка створення медикаменту" });
    }
  },
);

/**
 * PUT /api/medicines/:id
 * Оновлення медикаменту (тільки для адміністраторів)
 */
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection("medicines").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Медикамент не знайдено" });
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    // Видаляємо поля, які не повинні оновлюватися
    delete updateData.createdAt;
    delete updateData.id;

    await docRef.update(updateData);

    res.json({
      id: req.params.id,
      message: "Медикамент успішно оновлено",
    });
  } catch (error) {
    console.error("Помилка оновлення медикаменту:", error);
    res.status(500).json({ error: "Помилка оновлення медикаменту" });
  }
});

/**
 * DELETE /api/medicines/:id
 * Видалення медикаменту (тільки для адміністраторів)
 */
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection("medicines").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Медикамент не знайдено" });
    }

    await docRef.delete();

    res.json({ message: "Медикамент успішно видалено" });
  } catch (error) {
    console.error("Помилка видалення медикаменту:", error);
    res.status(500).json({ error: "Помилка видалення медикаменту" });
  }
});

/**
 * GET /api/medicines/categories/list
 * Отримання списку категорій
 */
router.get("/categories/list", async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection("medicines").get();
    const categories = new Set();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });

    res.json(Array.from(categories));
  } catch (error) {
    console.error("Помилка отримання категорій:", error);
    res.status(500).json({ error: "Помилка отримання категорій" });
  }
});

/**
 * POST /api/medicines/:id/instruction
 * Завантаження інструкції до медикаменту (тільки для адміністраторів)
 */
router.post(
  "/:id/instruction",
  authMiddleware,
  adminMiddleware,
  uploadInstruction.single("instruction"),
  async (req, res) => {
    try {
      const db = getDb();
      const docRef = db.collection("medicines").doc(req.params.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        // Видаляємо завантажений файл, якщо медикамент не знайдено
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: "Медикамент не знайдено" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Файл інструкції не завантажено" });
      }

      // Видаляємо старий файл інструкції, якщо він існує
      const oldData = doc.data();
      if (oldData.instructionUrl) {
        const oldFilePath = path.join(
          __dirname,
          "../public",
          oldData.instructionUrl.replace(process.env.SERVER_HOST || "", "").replace(/^\//, "")
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const SERVER_HOST =
        process.env.SERVER_HOST || `${req.protocol}://${req.get("host")}`;
      const instructionUrl = `${SERVER_HOST}/instructions/${req.file.filename}`;

      await docRef.update({
        instructionUrl,
        instructionFilename: req.file.originalname,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        message: "Інструкція успішно завантажена",
        instructionUrl,
        filename: req.file.originalname,
      });
    } catch (error) {
      console.error("Помилка завантаження інструкції:", error);
      // Видаляємо завантажений файл у разі помилки
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Помилка завантаження інструкції" });
    }
  }
);

/**
 * DELETE /api/medicines/:id/instruction
 * Видалення інструкції медикаменту (тільки для адміністраторів)
 */
router.delete(
  "/:id/instruction",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const db = getDb();
      const docRef = db.collection("medicines").doc(req.params.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Медикамент не знайдено" });
      }

      const data = doc.data();
      if (!data.instructionUrl) {
        return res.status(404).json({ error: "Інструкція не знайдена" });
      }

      // Видаляємо файл інструкції
      const filePath = path.join(
        __dirname,
        "../public",
        data.instructionUrl.replace(process.env.SERVER_HOST || "", "").replace(/^\//, "")
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await docRef.update({
        instructionUrl: null,
        instructionFilename: null,
        updatedAt: new Date().toISOString(),
      });

      res.json({ message: "Інструкція успішно видалена" });
    } catch (error) {
      console.error("Помилка видалення інструкції:", error);
      res.status(500).json({ error: "Помилка видалення інструкції" });
    }
  }
);

module.exports = router;
