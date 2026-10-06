import api from './api';

export const categoryService = {
  // Get all categories (with product counts)
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Create a category (Admin only)
  create: async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  // Update a category (Admin only)
  update: async (id, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  // Delete a category (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
