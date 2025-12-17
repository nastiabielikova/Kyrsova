import React from "react";
import {
  FaHeart,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Інформація про компанію */}
          <div className="footer-section">
            <h3 className="footer-title">Онлайн Аптека</h3>
            <p className="footer-text">
              Ваше здоров'я - наш пріоритет. Якісні медикаменти з доставкою по
              всій Україні.
            </p>
            <div className="social-links">
              <a href="https://facebook.com" className="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <FaFacebook />
              </a>
              <a href="https://instagram.com" className="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
              <a href="https://twitter.com" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                <FaTwitter />
              </a>
            </div>
          </div>

          {/* Контакти */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Контакти</h4>
            <div className="contact-info">
              <a href="tel:+380123456789" className="contact-link">
                <FaPhone />
                <span>+380 (12) 345-67-89</span>
              </a>
              <a href="mailto:info@apteka.ua" className="contact-link">
                <FaEnvelope />
                <span>info@apteka.ua</span>
              </a>
              <div className="contact-link">
                <FaMapMarkerAlt />
                <span>м. Київ, вул. Медична, 1</span>
              </div>
            </div>
          </div>

          {/* Графік роботи */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Графік роботи</h4>
            <div className="schedule">
              <div className="schedule-item">
                <span className="schedule-days">Пн - Пт</span>
                <span className="schedule-hours">08:00 - 20:00</span>
              </div>
              <div className="schedule-item">
                <span className="schedule-days">Сб - Нд</span>
                <span className="schedule-hours">09:00 - 18:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Копірайт */}
        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} Онлайн Аптека. Всі права захищені.
          </p>
          <p className="made-with">
            Зроблено з <FaHeart className="heart-icon" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
