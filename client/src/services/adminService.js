import api from './api';

export const adminService = {
  // Get all sellers with filter option
  getSellers: async (status = '') => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/sellers', { params });
    return response.data;
  },

  // Approve or reject a seller application
  updateSellerApproval: async (sellerId, action, remarks = '') => {
    const response = await api.put(`/admin/sellers/${sellerId}/approval`, {
      action,
      remarks,
    });
    return response.data;
  },

  // Get platform dashboard metrics
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Get all orders on the platform
  getAllOrders: async () => {
    const response = await api.get('/admin/orders');
    return response.data;
  },
};
