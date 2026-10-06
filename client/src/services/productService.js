import api from './api';

export const productService = {
  // Get all products with search, category filtering, sort, and pagination
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Get single product details by id or slug
  getByIdOrSlug: async (identifier) => {
    const response = await api.get(`/products/${identifier}`);
    return response.data;
  },

  // Get products created by the current logged-in seller
  getMyProducts: async () => {
    const response = await api.get('/products/seller/my-products');
    return response.data;
  },

  // Create new product with FormData for multi-image upload
  create: async (formData) => {
    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update existing product
  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  // Delete product (soft-delete)
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};
