import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ADMIN_TOKEN_KEY } from '../pages/Login';

const PrivateRoute = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
};

export default PrivateRoute;
