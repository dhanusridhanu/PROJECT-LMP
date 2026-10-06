import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isBuyer } = useAuth();
  const [cart, setCart] = useState({
    cart_id: null,
    items: [],
    totalItems: 0,
    totalAmount: 0.0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch cart from backend whenever authenticated as a buyer
  const fetchCart = useCallback(async () => {
    if (isAuthenticated && isBuyer) {
      try {
        setLoading(true);
        const res = await cartService.getCart();
        if (res.success) {
          setCart(res.cart);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setCart({ cart_id: null, items: [], totalItems: 0, totalAmount: 0.0 });
    }
  }, [isAuthenticated, isBuyer]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = async (productId, variantId = null, quantity = 1) => {
    try {
      const res = await cartService.addItem(productId, variantId, quantity);
      if (res.success) {
        await fetchCart();
      }
      return res;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add item to cart';
      throw new Error(message);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const res = await cartService.updateQuantity(cartItemId, quantity);
      if (res.success) {
        await fetchCart();
      }
      return res;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update quantity';
      throw new Error(message);
    }
  };

  // Remove item
  const removeFromCart = async (cartItemId) => {
    try {
      const res = await cartService.removeItem(cartItemId);
      if (res.success) {
        await fetchCart();
      }
      return res;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove item';
      throw new Error(message);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const res = await cartService.clearCart();
      if (res.success) {
        setCart({ cart_id: null, items: [], totalItems: 0, totalAmount: 0.0 });
      }
      return res;
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.totalItems,
        cartTotal: cart.totalAmount,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
