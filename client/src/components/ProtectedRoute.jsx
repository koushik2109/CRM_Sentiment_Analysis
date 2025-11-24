// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuth, loading } = useAuth();

  if (loading) {
    return <div style={{textAlign: 'center', padding: '50px'}}>Checking authentication...</div>;
  }

  // If not authenticated, redirect to the login page
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;