const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

// ВАЖЛИВО: завантажуємо .env ДО імпорту firebase
require("dotenv").config({ path: path.join(__dirname, '.env') });

const { initializeFirebase } = require("./config/firebase");

// Ініціалізація додатку
const app = express();
const PORT = process.env.PORT || 5000;

// Ініціалізація Firebase ОДРАЗУ
try {
  initializeFirebase();
} catch (error) {
  console.error("❌ Не вдалося ініціалізувати Firebase:", error.message);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static assets (зображення, статичні файли сервера)
app.use(express.static(path.join(__dirname, "public")));

// У production режимі роздаємо React білд
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/build");
  app.use(express.static(clientBuildPath));
}

// Disable caching for API routes
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Імпорт маршрутів
const medicinesRoutes = require("./routes/medicines");
const ordersRoutes = require("./routes/orders");
const usersRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const pharmaciesRoutes = require("./routes/pharmacies");

// Використання маршрутів
app.use("/api/medicines", medicinesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pharmacies", pharmaciesRoutes);

// Health check endpoint для Render
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Базовий маршрут API
app.get("/api", (req, res) => {
  res.json({
    message: "API системи аптеки працює",
    version: "1.0.0",
  });
});

// У production режимі всі інші запити перенаправляємо на React
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/build");
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  // В development режимі показуємо інформацію API
  app.get("/", (req, res) => {
    res.json({
      message: "API системи аптеки працює (development)",
      version: "1.0.0",
    });
  });
}

// Глобальний обробник помилок
app.use((err, req, res, next) => {
  console.error("Помилка сервера:", err);
  res.status(500).json({
    error: "Внутрішня помилка сервера",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущено на порту ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🌍 Режим: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
