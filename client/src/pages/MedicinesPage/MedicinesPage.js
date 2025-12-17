import React, { useState, useEffect } from "react";
import { medicinesAPI } from "../../services/api";
import { useCart } from "../../context/CartContext";
import {
  FaSearch,
  FaShoppingCart,
  FaPrescription,
  FaFilter,
  FaFileAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "./MedicinesPage.css";

const MedicinesPage = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const baseUrl = API_URL.replace("/api", "");
  const fallbackImageUrl = `${baseUrl}/images/meds/fallback.jpg`;
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const { addToCart } = useCart();

  // Завантаження медикаментів та категорій
  useEffect(() => {
    loadMedicines();
    loadCategories();
  }, []);

  // Фільтрація медикаментів
  useEffect(() => {
    filterMedicines();
  }, [searchQuery, selectedCategory, inStockOnly, medicines]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const response = await medicinesAPI.getAll();
      setMedicines(response.data);
    } catch (error) {
      console.error("Помилка завантаження медикаментів:", error);
      toast.error("Помилка завантаження медикаментів");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await medicinesAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error("Помилка завантаження категорій:", error);
    }
  };

  const filterMedicines = () => {
    let filtered = [...medicines];

    // Фільтр за пошуковим запитом
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.name.toLowerCase().includes(query) ||
          med.description?.toLowerCase().includes(query),
      );
    }

    // Фільтр за категорією
    if (selectedCategory) {
      filtered = filtered.filter((med) => med.category === selectedCategory);
    }

    // Фільтр за наявністю
    if (inStockOnly) {
      filtered = filtered.filter((med) => med.quantity > 0);
    }

    setFilteredMedicines(filtered);
  };

  const handleAddToCart = (medicine) => {
    if (medicine.quantity === 0) {
      toast.warning("Товар відсутній на складі");
      return;
    }
    addToCart(medicine, 1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Завантаження медикаментів...</p>
      </div>
    );
  }

  return (
    <div className="medicines-page">
      <div className="container">
        {/* Заголовок */}
        <div className="page-header">
          <h1>Каталог медикаментів</h1>
          <p className="page-subtitle">
            Знайдіть необхідні ліки та додайте їх до кошика
          </p>
        </div>

        {/* Фільтри */}
        <div className="filters-section">
          {/* Пошук */}
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Пошук медикаментів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Категорія */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">Всі категорії</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Наявність на складі */}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="checkbox-input"
            />
            <span>Тільки в наявності</span>
          </label>

          {/* Кількість результатів */}
          <div className="results-count">
            Знайдено: {filteredMedicines.length} товарів
          </div>
        </div>

        {/* Список медикаментів */}
        {filteredMedicines.length === 0 ? (
          <div className="no-results">
            <FaFilter className="no-results-icon" />
            <h3>Медикаменти не знайдено</h3>
            <p>Спробуйте змінити параметри пошуку</p>
          </div>
        ) : (
          <div className="medicines-grid">
            {filteredMedicines.map((medicine) => (
              <div key={medicine.id} className="medicine-card fade-in">
                {/* Зображення */}
                <div className="medicine-image">
                  {medicine.imageUrl ? (
                    <img
                      src={medicine.imageUrl}
                      alt={medicine.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackImageUrl;
                      }}
                    />
                  ) : (
                    <div className="medicine-placeholder">
                      <FaPrescription />
                    </div>
                  )}

                  {/* Бейджі */}
                  {medicine.prescription && (
                    <span className="badge-prescription">За рецептом</span>
                  )}
                  {medicine.quantity === 0 && (
                    <span className="badge-out-of-stock">
                      Немає в наявності
                    </span>
                  )}
                </div>

                {/* Інформація */}
                <div className="medicine-info">
                  <h3 className="medicine-name">{medicine.name}</h3>

                  {medicine.manufacturer && (
                    <p className="medicine-manufacturer">
                      {medicine.manufacturer}
                    </p>
                  )}

                  {medicine.description && (
                    <p className="medicine-description">
                      {medicine.description.substring(0, 100)}
                      {medicine.description.length > 100 && "..."}
                    </p>
                  )}

                  <div className="medicine-meta">
                    <span className="badge badge-info">
                      {medicine.category}
                    </span>
                    {medicine.quantity > 0 ? (
                      <span className="stock-status in-stock">
                        В наявності: {medicine.quantity} шт.
                      </span>
                    ) : (
                      <span className="stock-status out-of-stock">
                        Немає в наявності
                      </span>
                    )}
                  </div>
                </div>

                {/* Інструкція */}
                {medicine.instructionUrl && (
                  <div className="medicine-instruction">
                    <a
                      href={medicine.instructionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="instruction-link"
                    >
                      <FaFileAlt />
                      <span>Інструкція до застосування</span>
                    </a>
                  </div>
                )}

                {/* Ціна та кнопка */}
                <div className="medicine-footer">
                  <div className="medicine-price">
                    <span className="price-value">{medicine.price}</span>
                    <span className="price-currency">грн</span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(medicine)}
                    disabled={medicine.quantity === 0}
                    className="btn btn-primary btn-add-cart"
                  >
                    <FaShoppingCart />
                    До кошика
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicinesPage;
