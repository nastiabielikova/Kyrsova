import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../config/firebase";

// Ініціалізація Firebase
const app = initializeApp(firebaseConfig);

// Отримання сервісу автентифікації
export const auth = getAuth(app);

export default app;
