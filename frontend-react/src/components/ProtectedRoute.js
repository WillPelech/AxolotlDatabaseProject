import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireRestaurantOwner = false }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requireRestaurantOwner && !user.isRestaurant) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute; 