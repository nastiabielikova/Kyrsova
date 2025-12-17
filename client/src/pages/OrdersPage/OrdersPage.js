import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ordersAPI } from "../../services/api";
import {
  FaBox,
  FaCalendar,
  FaCreditCard,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./OrdersPage.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    loadOrders();
  }, [currentUser, navigate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error("Помилка завантаження замовлень:", error);
      toast.error("Помилка завантаження замовлень");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Ви впевнені, що хочете скасувати замовлення?")) {
      return;
    }

    try {
      await ordersAPI.cancel(orderId);
      toast.success("Замовлення скасовано");
      loadOrders();
    } catch (error) {
      console.error("Помилка скасування замовлення:", error);
      toast.error(
        error.response?.data?.error || "Помилка скасування замовлення",
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "В очікуванні", className: "badge-warning" },
      confirmed: { label: "Підтверджено", className: "badge-info" },
      processing: { label: "В обробці", className: "badge-info" },
      shipped: { label: "Відправлено", className: "badge-info" },
      delivered: { label: "Доставлено", className: "badge-success" },
      cancelled: { label: "Скасовано", className: "badge-danger" },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      className: "badge-info",
    };

    return (
      <span className={`badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Завантаження замовлень...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="page-header">
          <h1>Мої замовлення</h1>
          <p className="page-subtitle">Історія та статус ваших замовлень</p>
        </div>

        {/* Фільтри */}
        <div className="orders-filters">
          <button
            onClick={() => setFilter("all")}
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
          >
            Всі замовлення ({orders.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`filter-btn ${filter === "pending" ? "active" : ""}`}
          >
            В очікуванні
          </button>
          <button
            onClick={() => setFilter("delivered")}
            className={`filter-btn ${filter === "delivered" ? "active" : ""}`}
          >
            Доставлено
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`filter-btn ${filter === "cancelled" ? "active" : ""}`}
          >
            Скасовано
          </button>
        </div>

        {/* Список замовлень */}
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <FaBox className="no-orders-icon" />
            <h3>Замовлення відсутні</h3>
            <p>Ви ще не зробили жодного замовлення</p>
            <button
              onClick={() => navigate("/medicines")}
              className="btn btn-primary"
            >
              Перейти до каталогу
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card fade-in">
                <div className="order-header">
                  <div className="order-info">
                    <h3 className="order-number">
                      Замовлення #{order.id.substring(0, 8)}
                    </h3>
                    <div className="order-date">
                      <FaCalendar />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="order-body">
                  {/* Товари */}
                  <div className="order-items">
                    <h4>Товари:</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">× {item.quantity}</span>
                        <span className="item-price">
                          {item.total.toFixed(2)} грн
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Деталі доставки */}
                  <div className="order-details">
                    <div className="detail-row">
                      <FaMapMarkerAlt />
                      <div>
                        <strong>Адреса доставки:</strong>
                        <p>{order.deliveryAddress}</p>
                      </div>
                    </div>
                    {order.notes && (
                      <div className="detail-row">
                        <strong>Примітки:</strong>
                        <p>{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <FaCreditCard />
                    <span>Загальна сума:</span>
                    <strong>{order.totalAmount.toFixed(2)} грн</strong>
                  </div>

                  {order.status === "pending" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Скасувати замовлення
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
