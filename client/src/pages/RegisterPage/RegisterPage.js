import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaEnvelope, FaLock, FaUser, FaPhone } from "react-icons/fa";
import "./AuthPages.css";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Очищаємо помилку для цього поля
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Введіть ім'я";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Введіть email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Невалідний email";
    }

    if (!formData.password) {
      newErrors.password = "Введіть пароль";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль має містити мінімум 6 символів";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Паролі не збігаються";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Введіть номер телефону";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register(
        formData.email,
        formData.password,
        formData.displayName,
        formData.phoneNumber,
      );
      navigate("/medicines");
    } catch (error) {
      console.error("Помилка реєстрації:", error);
      // Помилки вже обробляються в AuthContext через toast
      // Але якщо потрібна додаткова обробка, можна додати сюди
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Реєстрація</h1>
            <p>Створіть акаунт для замовлення медикаментів</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <FaUser /> Ім'я
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={`form-input ${errors.displayName ? "error" : ""}`}
                placeholder="Введіть ваше ім'я"
              />
              {errors.displayName && (
                <span className="form-error">{errors.displayName}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaEnvelope /> Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="example@mail.com"
              />
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaPhone /> Телефон
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`form-input ${errors.phoneNumber ? "error" : ""}`}
                placeholder="+380 XX XXX XX XX"
              />
              {errors.phoneNumber && (
                <span className="form-error">{errors.phoneNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaLock /> Пароль
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? "error" : ""}`}
                placeholder="Мінімум 6 символів"
              />
              {errors.password && (
                <span className="form-error">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <FaLock /> Підтвердження паролю
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${
                  errors.confirmPassword ? "error" : ""
                }`}
                placeholder="Повторіть пароль"
              />
              {errors.confirmPassword && (
                <span className="form-error">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg btn-block"
            >
              {loading ? "Реєстрація..." : "Зареєструватися"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Вже маєте акаунт?{" "}
              <Link to="/login" className="auth-link">
                Увійти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
