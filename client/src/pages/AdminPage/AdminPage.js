import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { medicinesAPI, ordersAPI, usersAPI, pharmaciesAPI } from "../../services/api";
import {
  FaPills,
  FaBox,
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
  FaFileUpload,
  FaFilePdf,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./AdminPage.css";

const AdminPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const formatUserDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("uk-UA");
  };
  const [activeTab, setActiveTab] = useState("medicines");
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingPharmacy, setEditingPharmacy] = useState(null);
  const [instructionFile, setInstructionFile] = useState(null);
  const [uploadingInstruction, setUploadingInstruction] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    manufacturer: "",
    prescription: false,
    imageUrl: "",
  });
  const [pharmacyFormData, setPharmacyFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    workingHours: "9:00 - 21:00",
    description: "",
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Доступ заборонено");
      navigate("/");
      return;
    }
    loadData();
  }, [isAdmin, navigate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "medicines") {
        const response = await medicinesAPI.getAll();
        setMedicines(response.data);
      } else if (activeTab === "orders") {
        const response = await ordersAPI.getAll();
        setOrders(response.data);
      } else if (activeTab === "users") {
        const response = await usersAPI.getAll();
        setUsers(response.data);
      } else if (activeTab === "pharmacies") {
        const response = await pharmaciesAPI.getAll();
        setPharmacies(response.data);
      }
    } catch (error) {
      console.error("Помилка завантаження даних:", error);
      toast.error("Помилка завантаження даних");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleAddMedicine = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      quantity: "",
      category: "",
      manufacturer: "",
      prescription: false,
      imageUrl: "",
    });
    setShowModal(true);
  };

  const handleEditMedicine = (medicine) => {
    setEditingItem(medicine);
    setFormData({
      name: medicine.name,
      description: medicine.description || "",
      price: medicine.price.toString(),
      quantity: medicine.quantity.toString(),
      category: medicine.category,
      manufacturer: medicine.manufacturer || "",
      prescription: medicine.prescription || false,
      imageUrl: medicine.imageUrl || "",
    });
    setShowModal(true);
  };

  const handleSubmitMedicine = async (e) => {
    e.preventDefault();

    try {
      const medicineData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
      };

      if (editingItem) {
        await medicinesAPI.update(editingItem.id, medicineData);
        toast.success("Медикамент оновлено");
      } else {
        await medicinesAPI.create(medicineData);
        toast.success("Медикамент створено");
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Помилка збереження медикаменту:", error);
      toast.error(
        error.response?.data?.error || "Помилка збереження медикаменту",
      );
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей медикамент?")) {
      return;
    }

    try {
      await medicinesAPI.delete(id);
      toast.success("Медикамент видалено");
      loadData();
    } catch (error) {
      console.error("Помилка видалення:", error);
      toast.error("Помилка видалення медикаменту");
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      toast.success("Статус замовлення оновлено");
      loadData();
    } catch (error) {
      console.error("Помилка оновлення статусу:", error);
      toast.error("Помилка оновлення статусу");
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await usersAPI.updateRole(userId, role);
      toast.success("Роль користувача оновлено");
      loadData();
    } catch (error) {
      console.error("Помилка оновлення ролі:", error);
      toast.error("Помилка оновлення ролі");
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Pharmacy handlers
  const handleAddPharmacy = () => {
    setEditingPharmacy(null);
    setPharmacyFormData({
      name: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      workingHours: "9:00 - 21:00",
      description: "",
    });
    setShowPharmacyModal(true);
  };

  const handleEditPharmacy = (pharmacy) => {
    setEditingPharmacy(pharmacy);
    setPharmacyFormData({
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      phone: pharmacy.phone,
      email: pharmacy.email || "",
      workingHours: pharmacy.workingHours || "9:00 - 21:00",
      description: pharmacy.description || "",
    });
    setShowPharmacyModal(true);
  };

  const handlePharmacyInputChange = (e) => {
    setPharmacyFormData({
      ...pharmacyFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmitPharmacy = async (e) => {
    e.preventDefault();

    try {
      if (editingPharmacy) {
        await pharmaciesAPI.update(editingPharmacy.id, pharmacyFormData);
        toast.success("Аптеку оновлено");
      } else {
        await pharmaciesAPI.create(pharmacyFormData);
        toast.success("Аптеку створено");
      }

      setShowPharmacyModal(false);
      loadData();
    } catch (error) {
      console.error("Помилка збереження аптеки:", error);
      toast.error(error.response?.data?.error || "Помилка збереження аптеки");
    }
  };

  const handleDeletePharmacy = async (id) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цю аптеку?")) {
      return;
    }

    try {
      await pharmaciesAPI.delete(id);
      toast.success("Аптеку видалено");
      loadData();
    } catch (error) {
      console.error("Помилка видалення:", error);
      toast.error("Помилка видалення аптеки");
    }
  };

  // Instruction handlers
  const handleInstructionFileChange = (e) => {
    setInstructionFile(e.target.files[0]);
  };

  const handleUploadInstruction = async (medicineId) => {
    if (!instructionFile) {
      toast.error("Оберіть файл інструкції");
      return;
    }

    try {
      setUploadingInstruction(medicineId);
      await medicinesAPI.uploadInstruction(medicineId, instructionFile);
      toast.success("Інструкцію завантажено");
      setInstructionFile(null);
      loadData();
    } catch (error) {
      console.error("Помилка завантаження інструкції:", error);
      toast.error(error.response?.data?.error || "Помилка завантаження інструкції");
    } finally {
      setUploadingInstruction(null);
    }
  };

  const handleDeleteInstruction = async (medicineId) => {
    if (!window.confirm("Ви впевнені, що хочете видалити інструкцію?")) {
      return;
    }

    try {
      await medicinesAPI.deleteInstruction(medicineId);
      toast.success("Інструкцію видалено");
      loadData();
    } catch (error) {
      console.error("Помилка видалення інструкції:", error);
      toast.error("Помилка видалення інструкції");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Панель адміністратора</h1>
          <p>Управління системою аптеки</p>
        </div>

        {/* Вкладки */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab("medicines")}
            className={`tab-btn ${activeTab === "medicines" ? "active" : ""}`}
          >
            <FaPills />
            Медикаменти
            <span className="tab-count">{medicines.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          >
            <FaBox />
            Замовлення
            <span className="tab-count">{orders.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          >
            <FaUsers />
            Користувачі
            <span className="tab-count">{users.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("pharmacies")}
            className={`tab-btn ${activeTab === "pharmacies" ? "active" : ""}`}
          >
            <FaMapMarkerAlt />
            Аптеки
            <span className="tab-count">{pharmacies.length}</span>
          </button>
        </div>

        {/* Контент вкладок */}
        <div className="admin-content">
          {activeTab === "medicines" && (
            <div className="medicines-section">
              <div className="section-header">
                <h2>Управління медикаментами</h2>
                <div className="admin-actions">
                  <button
                    onClick={handleAddMedicine}
                    className="btn btn-primary"
                  >
                    <FaPlus />
                    Додати медикамент
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Замінити всi scenic/stock фото на локальний fallback?",
                        )
                      )
                        return;
                      try {
                        const res = await medicinesAPI.replaceScenic();
                        toast.success(`Оновлено ${res.data.updated} записів`);
                        loadData();
                      } catch (err) {
                        console.error(err);
                        toast.error("Помилка при заміні зображень");
                      }
                    }}
                    className="btn btn-secondary ml-sm"
                    title="Replace scenic images"
                  >
                    Замінити scenic фото
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Назва</th>
                      <th>Категорія</th>
                      <th>Ціна</th>
                      <th>Кількість</th>
                      <th>Виробник</th>
                      <th>Інструкція</th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((medicine) => (
                      <tr key={medicine.id}>
                        <td>
                          <strong>{medicine.name}</strong>
                          {medicine.prescription && (
                            <span className="badge badge-warning ml-sm">
                              За рецептом
                            </span>
                          )}
                        </td>
                        <td>{medicine.category}</td>
                        <td>{medicine.price} грн</td>
                        <td>
                          <span
                            className={
                              medicine.quantity > 0
                                ? "text-success"
                                : "text-danger"
                            }
                          >
                            {medicine.quantity} шт
                          </span>
                        </td>
                        <td>{medicine.manufacturer || "-"}</td>
                        <td>
                          <div className="instruction-cell">
                            {medicine.instructionUrl ? (
                              <div className="instruction-actions">
                                <a
                                  href={medicine.instructionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-icon btn-view"
                                  title="Переглянути інструкцію"
                                >
                                  <FaFilePdf />
                                </a>
                                <button
                                  onClick={() => handleDeleteInstruction(medicine.id)}
                                  className="btn-icon btn-delete"
                                  title="Видалити інструкцію"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            ) : (
                              <div className="upload-instruction">
                                <input
                                  type="file"
                                  id={`instruction-${medicine.id}`}
                                  accept=".pdf,.doc,.docx,.txt"
                                  onChange={handleInstructionFileChange}
                                  style={{ display: "none" }}
                                />
                                <label
                                  htmlFor={`instruction-${medicine.id}`}
                                  className="btn-icon btn-upload"
                                  title="Завантажити інструкцію"
                                >
                                  <FaFileUpload />
                                </label>
                                {instructionFile && (
                                  <button
                                    onClick={() => handleUploadInstruction(medicine.id)}
                                    className="btn-icon btn-check"
                                    disabled={uploadingInstruction === medicine.id}
                                    title="Підтвердити"
                                  >
                                    <FaCheck />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => handleEditMedicine(medicine)}
                              className="btn-icon btn-edit"
                              title="Редагувати"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteMedicine(medicine.id)}
                              className="btn-icon btn-delete"
                              title="Видалити"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="orders-section">
              <h2>Управління замовленнями</h2>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>№ Замовлення</th>
                      <th>Клієнт</th>
                      <th>Сума</th>
                      <th>Дата</th>
                      <th>Статус</th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id.substring(0, 8)}</td>
                        <td>{order.userEmail}</td>
                        <td>{order.totalAmount.toFixed(2)} грн</td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString(
                            "uk-UA",
                          )}
                        </td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value)
                            }
                            className="status-select"
                          >
                            <option value="pending">В очікуванні</option>
                            <option value="confirmed">Підтверджено</option>
                            <option value="processing">В обробці</option>
                            <option value="shipped">Відправлено</option>
                            <option value="delivered">Доставлено</option>
                            <option value="cancelled">Скасовано</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            Деталі
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="users-section">
              <h2>Управління користувачами</h2>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ім'я</th>
                      <th>Email</th>
                      <th>Телефон</th>
                      <th>Роль</th>
                      <th>Дата реєстрації</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.displayName}</td>
                        <td>{user.email}</td>
                        <td>{user.phoneNumber || "-"}</td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleUpdateUserRole(user.id, e.target.value)
                            }
                            className="role-select"
                          >
                            <option value="user">Користувач</option>
                            <option value="admin">Адміністратор</option>
                          </select>
                        </td>
                        <td>{formatUserDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "pharmacies" && (
            <div className="pharmacies-section">
              <div className="section-header">
                <h2>Управління аптеками</h2>
                <button
                  onClick={handleAddPharmacy}
                  className="btn btn-primary"
                >
                  <FaPlus />
                  Додати аптеку
                </button>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Назва</th>
                      <th>Місто</th>
                      <th>Адреса</th>
                      <th>Телефон</th>
                      <th>Режим роботи</th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacies.map((pharmacy) => (
                      <tr key={pharmacy.id}>
                        <td><strong>{pharmacy.name}</strong></td>
                        <td>{pharmacy.city}</td>
                        <td>{pharmacy.address}</td>
                        <td>{pharmacy.phone}</td>
                        <td>{pharmacy.workingHours}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              onClick={() => handleEditPharmacy(pharmacy)}
                              className="btn-icon btn-edit"
                              title="Редагувати"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeletePharmacy(pharmacy.id)}
                              className="btn-icon btn-delete"
                              title="Видалити"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальне вікно деталей замовлення */}
      {showOrderModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Замовлення #{selectedOrder.id.substring(0, 8)}</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-content order-details-modal">
              <div className="order-details-row">
                <div>
                  <strong>Клієнт:</strong> {selectedOrder.userEmail}
                </div>
                <div>
                  <strong>Статус:</strong> {selectedOrder.status}
                </div>
                <div>
                  <strong>Дата:</strong>{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString("uk-UA")}
                </div>
              </div>

              <div className="order-details-row">
                <div>
                  <strong>Адреса доставки:</strong>
                  <p>{selectedOrder.deliveryAddress}</p>
                </div>
                {selectedOrder.notes ? (
                  <div>
                    <strong>Примітки:</strong>
                    <p>{selectedOrder.notes}</p>
                  </div>
                ) : null}
              </div>

              <div className="order-items-list">
                <h4>Товари</h4>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span>{item.name}</span>
                    <span>× {item.quantity}</span>
                    <span>{item.total?.toFixed(2)} грн</span>
                  </div>
                ))}
              </div>

              <div className="order-total-row">
                <strong>Сума:</strong>
                <span>{selectedOrder.totalAmount?.toFixed(2)} грн</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно для додавання/редагування медикаменту */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingItem ? "Редагувати медикамент" : "Додати медикамент"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitMedicine} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Назва *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Категорія *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Опис</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ціна (грн) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="form-input"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Кількість *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Виробник</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL зображення</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="prescription"
                    checked={formData.prescription}
                    onChange={handleInputChange}
                    className="checkbox-input"
                  />
                  <span>Відпускається за рецептом</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  <FaCheck />
                  {editingItem ? "Оновити" : "Створити"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальне вікно аптеки */}
      {showPharmacyModal && (
        <div className="modal-overlay" onClick={() => setShowPharmacyModal(false)}>
          <div className="modal large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPharmacy ? "Редагувати аптеку" : "Додати аптеку"}</h2>
              <button
                onClick={() => setShowPharmacyModal(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitPharmacy} className="modal-content">
              <div className="form-group">
                <label className="form-label">Назва аптеки *</label>
                <input
                  type="text"
                  name="name"
                  value={pharmacyFormData.name}
                  onChange={handlePharmacyInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Місто *</label>
                  <input
                    type="text"
                    name="city"
                    value={pharmacyFormData.city}
                    onChange={handlePharmacyInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Адреса *</label>
                  <input
                    type="text"
                    name="address"
                    value={pharmacyFormData.address}
                    onChange={handlePharmacyInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Телефон *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={pharmacyFormData.phone}
                    onChange={handlePharmacyInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={pharmacyFormData.email}
                    onChange={handlePharmacyInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Режим роботи</label>
                <input
                  type="text"
                  name="workingHours"
                  value={pharmacyFormData.workingHours}
                  onChange={handlePharmacyInputChange}
                  className="form-input"
                  placeholder="9:00 - 21:00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Опис</label>
                <textarea
                  name="description"
                  value={pharmacyFormData.description}
                  onChange={handlePharmacyInputChange}
                  className="form-textarea"
                  rows="3"
                  placeholder="Додаткова інформація про аптеку..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowPharmacyModal(false)}
                  className="btn btn-secondary"
                >
                  Скасувати
                </button>
                <button type="submit" className="btn btn-primary">
                  <FaCheck />
                  {editingPharmacy ? "Оновити" : "Створити"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
