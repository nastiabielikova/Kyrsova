import React, { useState, useEffect } from "react";
import { pharmaciesAPI } from "../../services/api";
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from "react-icons/fa";
import { toast } from "react-toastify";
import "./PharmaciesPage.css";

const PharmaciesPage = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("all");

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      setLoading(true);
      const response = await pharmaciesAPI.getAll();
      setPharmacies(response.data);
    } catch (error) {
      console.error("Помилка завантаження аптек:", error);
      toast.error("Помилка завантаження списку аптек");
    } finally {
      setLoading(false);
    }
  };

  const cities = [...new Set(pharmacies.map((p) => p.city))];

  const filteredPharmacies =
    selectedCity === "all"
      ? pharmacies
      : pharmacies.filter((p) => p.city === selectedCity);

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  return (
    <div className="pharmacies-page">
      <div className="pharmacies-header">
        <h1>Наші аптеки</h1>
        <p>Знайдіть найближчу аптеку у вашому місті</p>
      </div>

      {cities.length > 0 && (
        <div className="city-filter">
          <label>Місто:</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="all">Всі міста</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="pharmacies-grid">
        {filteredPharmacies.length === 0 ? (
          <div className="no-pharmacies">
            <p>Аптеки не знайдено</p>
          </div>
        ) : (
          filteredPharmacies.map((pharmacy) => (
            <div key={pharmacy.id} className="pharmacy-card">
              <div className="pharmacy-header">
                <h3>{pharmacy.name}</h3>
                <span className="city-badge">{pharmacy.city}</span>
              </div>

              <div className="pharmacy-info">
                <div className="info-item">
                  <FaMapMarkerAlt className="icon" />
                  <span>{pharmacy.address}</span>
                </div>

                <div className="info-item">
                  <FaPhone className="icon" />
                  <a href={`tel:${pharmacy.phone}`}>{pharmacy.phone}</a>
                </div>

                {pharmacy.email && (
                  <div className="info-item">
                    <FaEnvelope className="icon" />
                    <a href={`mailto:${pharmacy.email}`}>{pharmacy.email}</a>
                  </div>
                )}

                <div className="info-item">
                  <FaClock className="icon" />
                  <span>{pharmacy.workingHours || "9:00 - 21:00"}</span>
                </div>

                {pharmacy.description && (
                  <div className="pharmacy-description">
                    <p>{pharmacy.description}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PharmaciesPage;
