const API_BASE_URL = 'http://localhost:5000/api';

export const restaurantApi = {
    // Get all restaurants
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/restaurants`);
        if (!response.ok) throw new Error('Failed to fetch restaurants');
        return response.json();
    },

    getFoods: async (id) => {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}/foods`);
        if (!response.ok) throw new Error('Failed to fetch foods');
        return response.json();
    },

    // Get restaurant photos
    getPhotos: async (id) => {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}/photos`);
        if (!response.ok) throw new Error('Failed to fetch restaurant photos');
        return response.json();
    },

    // Upload a restaurant photo
    uploadPhoto: async (id, photoData, authToken) => {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}/photos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(photoData),
        });
        if (!response.ok) throw new Error('Failed to upload photo');
        return response.json();
    },

    // Delete a restaurant photo
    deletePhoto: async (restaurantId, photoId, authToken) => {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/photos/${photoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete photo');
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
    },

    // get visited restaurants
    getReviewedRestaurants: async (id) => {
        const response = await fetch(`${API_BASE_URL}/customers/${id}/restaurants`, {
            method: 'GET',
        });
        if(!response.ok) throw new Error('Failed to get reviewed restaurants');
        return response.json();
    },

    // get owned restaurants

}; 