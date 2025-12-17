import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { ordersAPI } from "../../services/api";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaShoppingBag,
  FaCheck,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./CartPage.css";

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
  } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    deliveryAddress: "",
    phoneNumber: "",
    notes: "",
  });

  const handleQuantityChange = (medicineId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(medicineId, newQuantity);
    }
  };

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const baseUrl = API_URL.replace("/api", "");
  const fallbackImageUrl = `${baseUrl}/images/meds/fallback.jpg`;

  const handleInputChange = (e) => {
    setOrderData({
      ...orderData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckout = () => {
    if (!currentUser) {
      toast.info("Увійдіть в систему для оформлення замовлення");
      navigate("/login");
      return;
    }
    setShowCheckout(true);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!orderData.deliveryAddress.trim() || !orderData.phoneNumber.trim()) {
      toast.error("Заповніть всі обов'язкові поля");
      return;
    }

    setLoading(true);
    try {
      const items = cartItems.map((item) => ({
        medicineId: item.id,
        quantity: item.quantity,
      }));

      const response = await ordersAPI.create({
        items,
        deliveryAddress: orderData.deliveryAddress,
        phoneNumber: orderData.phoneNumber,
        notes: orderData.notes,
      });

      toast.success("Замовлення успішно оформлено!");
      clearCart();
      navigate(`/orders`);
    } catch (error) {
      console.error("Помилка оформлення замовлення:", error);
      toast.error(
        error.response?.data?.error || "Помилка оформлення замовлення",
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <FaShoppingBag className="empty-cart-icon" />
            <h2>Кошик порожній</h2>
            <p>Додайте медикаменти з каталогу</p>
            <button
              onClick={() => navigate("/medicines")}
              className="btn btn-primary btn-lg"
            >
              Перейти до каталогу
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="checkout-container">
            <h1>Оформлення замовлення</h1>

            <div className="checkout-grid">
              {/* Форма замовлення */}
              <div className="checkout-form-section">
                <form onSubmit={handleSubmitOrder} className="checkout-form">
                  <div className="form-group">
                    <label className="form-label">Адреса доставки *</label>
                    <input
                      type="text"
                      name="deliveryAddress"
                      value={orderData.deliveryAddress}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Вулиця, будинок, квартира"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Номер телефону *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={orderData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="+380 XX XXX XX XX"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Примітки</label>
                    <textarea
                      name="notes"
                      value={orderData.notes}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="Додаткова інформація для доставки..."
                      rows="3"
                    />
                  </div>

                  <div className="checkout-actions">
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      className="btn btn-secondary"
                    >
                      Назад до кошика
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      <FaCheck />
                      {loading ? "Обробка..." : "Підтвердити замовлення"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Підсумок замовлення */}
              <div className="order-summary">
                <h3>Підсумок замовлення</h3>
                <div className="summary-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="summary-item">
                      <span className="summary-item-name">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="summary-item-price">
                        {(item.price * item.quantity).toFixed(2)} грн
                      </span>
                    </div>
                  ))}
                </div>
                <div className="summary-total">
                  <span>Загальна сума:</span>
                  <span className="total-amount">
                    {getTotalAmount().toFixed(2)} грн
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Кошик покупок</h1>
          <button onClick={clearCart} className="btn btn-secondary btn-sm">
            <FaTrash />
            Очистити кошик
          </button>
        </div>

        <div className="cart-grid">
          {/* Список товарів */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item fade-in">
                <div className="cart-item-image">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackImageUrl;
                      }}
                    />
                  ) : (
                    <div className="cart-item-placeholder">Фото</div>
                  )}
                </div>

                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  {item.manufacturer && (
                    <p className="cart-item-manufacturer">
                      {item.manufacturer}
                    </p>
                  )}
                  <span className="badge badge-info">{item.category}</span>
                </div>

                <div className="cart-item-quantity">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity, -1)
                    }
                    className="quantity-btn"
                    disabled={item.quantity <= 1}
                  >
                    <FaMinus />
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity, 1)
                    }
                    className="quantity-btn"
                  >
                    <FaPlus />
                  </button>
                </div>

                <div className="cart-item-price">
                  <div className="item-unit-price">{item.price} грн/шт</div>
                  <div className="item-total-price">
                    {(item.price * item.quantity).toFixed(2)} грн
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="cart-item-remove"
                  title="Видалити"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          {/* Підсумок */}
          <div className="cart-summary">
            <h3>Підсумок</h3>

            <div className="summary-row">
              <span>Товарів у кошику:</span>
              <span>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} шт
              </span>
            </div>

            <div className="summary-row">
              <span>Сума:</span>
              <span>{getTotalAmount().toFixed(2)} грн</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row summary-total">
              <span>До сплати:</span>
              <span className="total-price">
                {getTotalAmount().toFixed(2)} грн
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="btn btn-primary btn-lg btn-block"
            >
              Оформити замовлення
            </button>

            <button
              onClick={() => navigate("/medicines")}
              className="btn btn-secondary btn-block"
            >
              Продовжити покупки
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
