import api from './api';

export const cartService = {
  // Get current user's shopping cart
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add an item to the shopping cart
  addItem: async (productId, variantId = null, quantity = 1) => {
    const response = await api.post('/cart/items', {
      product_id: productId,
      variant_id: variantId,
      quantity,
    });
    return response.data;
  },

  // Update quantity of an item in the cart
  updateQuantity: async (cartItemId, quantity) => {
    const response = await api.put(`/cart/items/${cartItemId}`, { quantity });
    return response.data;
  },

  // Remove an item from the cart
  removeItem: async (cartItemId) => {
    const response = await api.delete(`/cart/items/${cartItemId}`);
    return response.data;
  },

  // Clear all items from the cart
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },
};
