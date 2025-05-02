// components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can render a loading spinner or message here
    return <div>Loading...</div>;
  }

  return user ? element : <Navigate to="/" />; // Redirect to home (or login)
};

export default PrivateRoute;