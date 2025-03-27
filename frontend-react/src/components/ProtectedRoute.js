import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireRestaurantOwner = false }) => {
    const { isAuthenticated, isRestaurantOwner } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requireRestaurantOwner && !isRestaurantOwner()) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute; 