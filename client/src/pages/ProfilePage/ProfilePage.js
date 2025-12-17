import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaEdit,
  FaSave,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || "",
        phoneNumber: userProfile.phoneNumber || "",
        address: userProfile.address || "",
        dateOfBirth: userProfile.dateOfBirth || "",
      });
    }
  }, [currentUser, userProfile, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateUserProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Помилка оновлення профілю:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || "",
        phoneNumber: userProfile.phoneNumber || "",
        address: userProfile.address || "",
        dateOfBirth: userProfile.dateOfBirth || "",
      });
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Завантаження профілю...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <FaUser />
            </div>
            <div className="profile-info">
              <h1>{userProfile.displayName}</h1>
              <p className="profile-email">{currentUser.email}</p>
              {userProfile.role === "admin" && (
                <span className="badge badge-info">Адміністратор</span>
              )}
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-section">
              <div className="section-header">
                <h2>Особиста інформація</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    <FaEdit />
                    Редагувати
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-group">
                    <label className="form-label">
                      <FaUser /> Ім'я
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
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
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <FaMapMarkerAlt /> Адреса
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Дата народження</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      <FaSave />
                      Зберегти
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-secondary"
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-details">
                  <div className="detail-item">
                    <FaUser className="detail-icon" />
                    <div>
                      <label>Ім'я</label>
                      <p>{formData.displayName || "Не вказано"}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <FaEnvelope className="detail-icon" />
                    <div>
                      <label>Email</label>
                      <p>{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <FaPhone className="detail-icon" />
                    <div>
                      <label>Телефон</label>
                      <p>{formData.phoneNumber || "Не вказано"}</p>
                    </div>
                  </div>

                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <div>
                      <label>Адреса</label>
                      <p>{formData.address || "Не вказано"}</p>
                    </div>
                  </div>

                  {formData.dateOfBirth && (
                    <div className="detail-item">
                      <div>
                        <label>Дата народження</label>
                        <p>
                          {new Date(formData.dateOfBirth).toLocaleDateString(
                            "uk-UA",
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
