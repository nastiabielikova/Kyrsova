import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  FaUserCircle,
  FaShoppingCart,
  FaPills,
  FaSignOutAlt,
  FaUserShield,
} from "react-icons/fa";
import "./Header.css";

const Header = () => {
  const { currentUser, isAdmin, logout } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Логотип */}
          <Link to="/" className="logo">
            <FaPills className="logo-icon" />
            <span className="logo-text">Онлайн Аптека</span>
          </Link>

          {/* Навігація */}
          <nav className="nav">
            <Link to="/medicines" className="nav-link">
              Медикаменти
            </Link>

            <Link to="/pharmacies" className="nav-link">
              Наші аптеки
            </Link>

            {currentUser && (
              <Link to="/orders" className="nav-link">
                Мої замовлення
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" className="nav-link admin-link">
                <FaUserShield />
                Адмін панель
              </Link>
            )}
          </nav>

          {/* Дії користувача */}
          <div className="header-actions">
            {currentUser ? (
              <>
                <Link to="/cart" className="cart-btn">
                  <FaShoppingCart />
                  {getTotalItems() > 0 && (
                    <span className="cart-badge">{getTotalItems()}</span>
                  )}
                </Link>

                <Link to="/profile" className="profile-btn">
                  <FaUserCircle />
                  <span className="profile-name">
                    {currentUser.displayName || "Профіль"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                >
                  <FaSignOutAlt />
                  Вихід
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Вхід
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Реєстрація
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
