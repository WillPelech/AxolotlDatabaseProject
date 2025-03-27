import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

export function useRestaurants() {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all restaurants
    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/restaurants`);
            if (!response.ok) throw new Error('Failed to fetch restaurants');
            const data = await response.json();
            setRestaurants(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Add a new restaurant
    const addRestaurant = async (restaurantData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(restaurantData),
            });
            if (!response.ok) throw new Error('Failed to add restaurant');
            await fetchRestaurants(); // Refresh the list
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Update a restaurant
    const updateRestaurant = async (id, restaurantData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(restaurantData),
            });
            if (!response.ok) throw new Error('Failed to update restaurant');
            await fetchRestaurants(); // Refresh the list
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Delete a restaurant
    const deleteRestaurant = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete restaurant');
            await fetchRestaurants(); // Refresh the list
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Get a single restaurant
    const getRestaurant = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
            if (!response.ok) throw new Error('Failed to fetch restaurant');
            return await response.json();
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchRestaurants();
    }, []);

    return {
        restaurants,
        loading,
        error,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
        getRestaurant,
        refreshRestaurants: fetchRestaurants
    };
} 