import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Protected Route Guard
import ProtectedRoute from './components/ProtectedRoute';

// Public & Buyer Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Seller / Artisan Pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import ManageProductsPage from './pages/seller/ManageProductsPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SellerApprovalsPage from './pages/admin/SellerApprovalsPage';
import ManageCategoriesPage from './pages/admin/ManageCategoriesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';

function App() {
  return (
    <Routes>
      {/* Public Storefront & Buyer Routes (MainLayout) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:identifier" element={<ProductDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Buyer Shopping Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/history"
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Protected Seller / Artisan Dashboard Routes */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute allowedRoles={['seller']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SellerDashboardPage />} />
        <Route path="products" element={<ManageProductsPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="approvals" element={<SellerApprovalsPage />} />
        <Route path="categories" element={<ManageCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
      </Route>
    </Routes>
  );
}

export default App;
