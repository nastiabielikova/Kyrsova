import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart має використовуватися всередині CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Завантаження кошика з localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Помилка завантаження кошика:", error);
      }
    }
  }, []);

  // Збереження кошика в localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Додавання товару до кошика
  const addToCart = (medicine, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === medicine.id);
      const availableStock = medicine.quantity ?? existingItem?.stockQuantity;

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const maxQuantity =
          existingItem.stockQuantity ??
          availableStock ??
          Number.MAX_SAFE_INTEGER;

        if (newQuantity > maxQuantity) {
          toast.warning("Недостатня кількість товару на складі");
          return prevItems.map((item) =>
            item.id === medicine.id ? { ...item, quantity: maxQuantity } : item,
          );
        }

        toast.success("Кількість оновлено");
        return prevItems.map((item) =>
          item.id === medicine.id
            ? { ...item, quantity: newQuantity, stockQuantity: maxQuantity }
            : item,
        );
      }

      toast.success("Товар додано до кошика");
      return [
        ...prevItems,
        {
          ...medicine,
          quantity,
          stockQuantity: availableStock ?? Number.MAX_SAFE_INTEGER,
        },
      ];
    });
  };

  // Видалення товару з кошика
  const removeFromCart = (medicineId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== medicineId),
    );
    toast.info("Товар видалено з кошика");
  };

  // Оновлення кількості товару
  const updateQuantity = (medicineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === medicineId) {
          const maxQuantity =
            item.stockQuantity ??
            item.availableQuantity ??
            Number.MAX_SAFE_INTEGER;

          if (quantity > maxQuantity) {
            toast.warning("Недостатня кількість товару на складі");
            return { ...item, quantity: maxQuantity };
          }

          return { ...item, quantity };
        }
        return item;
      }),
    );
  };

  // Очищення кошика
  const clearCart = () => {
    setCartItems([]);
    toast.info("Кошик очищено");
  };

  // Отримання загальної суми
  const getTotalAmount = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  // Отримання загальної кількості товарів
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
