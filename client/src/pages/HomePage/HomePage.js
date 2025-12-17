import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPills,
  FaShoppingCart,
  FaShieldAlt,
  FaTruck,
  FaHeartbeat,
  FaClock,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="home-page">
      {/* Героїчна секція */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title fade-in">
              Ваше здоров'я - наш пріоритет
            </h1>
            <p className="hero-subtitle fade-in">
              Онлайн аптека з широким асортиментом якісних медикаментів та
              швидкою доставкою
            </p>
            <div className="hero-actions fade-in">
              <button
                onClick={() => navigate("/medicines")}
                className="btn btn-primary btn-lg"
              >
                <FaPills />
                Переглянути каталог
              </button>
              {!currentUser && (
                <button
                  onClick={() => navigate("/register")}
                  className="btn btn-secondary btn-lg"
                >
                  Зареєструватися
                </button>
              )}
            </div>
          </div>
          <div className="hero-illustration">
            <div className="illustration-circle"></div>
            <FaHeartbeat className="illustration-icon" />
          </div>
        </div>
      </section>

      {/* Переваги */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Чому обирають нас?</h2>
          <div className="features-grid">
            <div className="feature-card fade-in">
              <div className="feature-icon">
                <FaShieldAlt />
              </div>
              <h3>Якість гарантована</h3>
              <p>
                Всі медикаменти сертифіковані та пройшли необхідні перевірки
                якості
              </p>
            </div>

            <div className="feature-card fade-in">
              <div className="feature-icon">
                <FaTruck />
              </div>
              <h3>Швидка доставка</h3>
              <p>
                Доставка замовлень по всій Україні протягом 1-3 робочих днів
              </p>
            </div>

            <div className="feature-card fade-in">
              <div className="feature-icon">
                <FaShoppingCart />
              </div>
              <h3>Зручне замовлення</h3>
              <p>
                Простий та зрозумілий інтерфейс для швидкого оформлення
                замовлення
              </p>
            </div>

            <div className="feature-card fade-in">
              <div className="feature-icon">
                <FaClock />
              </div>
              <h3>Цілодобова підтримка</h3>
              <p>Наші фахівці завжди готові відповісти на ваші запитання</p>
            </div>
          </div>
        </div>
      </section>

      {/* Категорії */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Популярні категорії</h2>
          <div className="categories-grid">
            {[
              "Знеболювальні",
              "Вітаміни",
              "Антибіотики",
              "Серцево-судинні",
              "Протизастудні",
              "Дерматологія",
            ].map((category, index) => (
              <div
                key={index}
                className="category-card fade-in"
                onClick={() => navigate("/medicines")}
              >
                <FaPills className="category-icon" />
                <h3>{category}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Готові зробити замовлення?</h2>
            <p>
              Приєднуйтесь до тисяч задоволених клієнтів, які обрали нашу онлайн
              аптеку
            </p>
            <button
              onClick={() => navigate("/medicines")}
              className="btn btn-primary btn-lg"
            >
              Почати покупки
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
