import React, { createContext, useState, useEffect, useContext } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../services/firebase";
import { authAPI, usersAPI } from "../services/api";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth має використовуватися всередині AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Завантаження профілю користувача
  const loadUserProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      setUserProfile(response.data);
    } catch (error) {
      console.error("Помилка завантаження профілю:", error);
    }
  };

  // Реєстрація нового користувача
  const register = async (email, password, displayName, phoneNumber) => {
    try {
      // Реєструємо на сервері (сервер створює користувача в Firebase)
      await authAPI.register({
        email,
        password,
        displayName,
        phoneNumber,
      });

      // Потім входимо в систему
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      toast.success("Реєстрацію успішно завершено!");
      return userCredential.user;
    } catch (error) {
      console.error("Помилка реєстрації:", error);
      let errorMessage = "Помилка реєстрації";

      // Обробка помилок з сервера
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = errors.map((e) => e.msg).join(", ");
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Користувач з таким email вже існує";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Пароль занадто слабкий";
      }

      toast.error(errorMessage);
      throw error;
    }
  };

  // Вхід в систему
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      toast.success("Вхід успішний!");
      return userCredential.user;
    } catch (error) {
      console.error("Помилка входу:", error);
      let errorMessage = "Помилка входу";

      if (error.code === "auth/user-not-found") {
        errorMessage = "Користувача не знайдено";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Невірний пароль";
      }

      toast.error(errorMessage);
      throw error;
    }
  };

  // Вихід з системи
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      toast.info("Ви вийшли з системи");
    } catch (error) {
      console.error("Помилка виходу:", error);
      toast.error("Помилка виходу з системи");
    }
  };

  // Оновлення профілю
  const updateUserProfile = async (data) => {
    try {
      const response = await usersAPI.updateProfile(data);
      setUserProfile((prev) => ({ ...prev, ...response.data }));
      toast.success("Профіль оновлено");
      return response.data;
    } catch (error) {
      console.error("Помилка оновлення профілю:", error);
      toast.error("Помилка оновлення профілю");
      throw error;
    }
  };

  // Відстеження стану автентифікації
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);

        if (user) {
          await loadUserProfile();
        } else {
          setUserProfile(null);
        }

        setLoading(false);
      });

      // Таймаут: якщо Firebase не відповідає протягом 3 сек, вважаємо завантаження завершеним
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3000);

      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (error) {
      console.error("Firebase error:", error);
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    userProfile,
    register,
    login,
    logout,
    updateUserProfile,
    isAdmin: userProfile?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          color: "#666",
        }}>
          Завантаження...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
