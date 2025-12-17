const { verifyToken } = require("../config/firebase");

/**
 * Middleware для перевірки автентифікації користувача
 * Перевіряє наявність та валідність JWT токену
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Відсутній токен автентифікації",
      });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await verifyToken(token);

    // Додаємо інформацію про користувача до запиту
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    return res.status(403).json({
      error: "Невалідний токен автентифікації",
    });
  }
};

/**
 * Middleware для перевірки ролі адміністратора
 */
const adminMiddleware = async (req, res, next) => {
  try {
    const { getDb } = require("../config/firebase");
    const db = getDb();

    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists || userDoc.data().role !== "admin") {
      return res.status(403).json({
        error: "Доступ заборонено. Потрібні права адміністратора",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: "Помилка перевірки прав доступу",
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};
