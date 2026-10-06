import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [], requireApproved = false }) => {
  const { user, isAuthenticated, loading, isSeller, isApprovedSeller } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login page and remember where the user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If this route strictly requires an approved artisan
  if (requireApproved && isSeller && !isApprovedSeller) {
    return <Navigate to="/seller/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
