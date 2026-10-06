import api from './api';

export const orderService = {
  // Place order from cart
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Get current buyer's order history
  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },

  // Get single order details
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Get orders that an artisan needs to fulfill
  getSellerOrders: async () => {
    const response = await api.get('/orders/seller');
    return response.data;
  },

  // Update order status (PLACED -> SHIPPED -> DELIVERED or CANCELLED)
  updateStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};
