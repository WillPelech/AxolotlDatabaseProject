const API_BASE_URL = 'http://localhost:5000/api';

export const restaurantApi = {
    // Get all restaurants
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/restaurants`);
        if (!response.ok) throw new Error('Failed to fetch restaurants');
        return response.json();
    },

    // Get single restaurant
    getOne: async (id) => {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);
        if (!response.ok) throw new Error('Failed to fetch restaurant');
        return response.json();
    },

    // Add new restaurant
    create: async (restaurantData) => {
        const response = await fetch(`${API_BASE_URL}/restaurants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(restaurantData),
        });
        if (!response.ok) throw new Error('Failed to create restaurant');
        return response.json();
    },

    // Update restaurant
    update: async (id, restaurantData) => {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(restaurantData),
        });
        if (!response.ok) throw new Error('Failed to update restaurant');
        return response.json();
    },

    // Delete restaurant
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete restaurant');
        return response.json();
    }
}; 