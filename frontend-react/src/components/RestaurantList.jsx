import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../services/api';

function RestaurantList() {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingRestaurant, setEditingRestaurant] = useState(null);
    const [newRestaurant, setNewRestaurant] = useState({
        name: '',
        address: '',
        cuisine: ''
    });

    // Load restaurants
    useEffect(() => {
        loadRestaurants();
    }, []);

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            const data = await restaurantApi.getAll();
            setRestaurants(data || []); // Ensure we always have an array
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Add restaurant
    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await restaurantApi.create(newRestaurant);
            setNewRestaurant({ name: '', address: '', cuisine: '' });
            loadRestaurants();
        } catch (err) {
            setError(err.message);
        }
    };

    // Start editing a restaurant
    const handleStartEdit = (restaurant) => {
        setEditingRestaurant({
            id: restaurant.id,
            name: restaurant.name || '',
            address: restaurant.address || '',
            cuisine: restaurant.cuisine || ''
        });
    };

    // Update restaurant
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingRestaurant?.id) return;
        
        try {
            await restaurantApi.update(editingRestaurant.id, editingRestaurant);
            setEditingRestaurant(null);
            loadRestaurants();
        } catch (err) {
            setError(err.message);
        }
    };

    // Delete restaurant
    const handleDelete = async (id) => {
        if (!id) return;
        
        if (window.confirm('Are you sure you want to delete this restaurant?')) {
            try {
                await restaurantApi.delete(id);
                loadRestaurants();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading) return <div className="text-center p-4">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6">Restaurants</h2>
            
            {/* Add Restaurant Form */}
            <form onSubmit={handleAdd} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h3 className="text-xl font-semibold mb-4">Add New Restaurant</h3>
                <div className="grid grid-cols-1 gap-4">
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        type="text"
                        placeholder="Restaurant Name"
                        value={newRestaurant.name}
                        onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                        required
                    />
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        type="text"
                        placeholder="Address"
                        value={newRestaurant.address}
                        onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                        required
                    />
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        type="text"
                        placeholder="Cuisine"
                        value={newRestaurant.cuisine}
                        onChange={(e) => setNewRestaurant({...newRestaurant, cuisine: e.target.value})}
                        required
                    />
                    <button 
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Add Restaurant
                    </button>
                </div>
            </form>

            {/* Restaurant List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurants.map(restaurant => (
                    <div key={restaurant.id} className="bg-white shadow-md rounded-lg p-6">
                        {editingRestaurant && editingRestaurant.id === restaurant.id ? (
                            // Edit Form
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                    type="text"
                                    value={editingRestaurant.name || ''}
                                    onChange={(e) => setEditingRestaurant({
                                        ...editingRestaurant,
                                        name: e.target.value
                                    })}
                                    required
                                />
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                    type="text"
                                    value={editingRestaurant.address || ''}
                                    onChange={(e) => setEditingRestaurant({
                                        ...editingRestaurant,
                                        address: e.target.value
                                    })}
                                    required
                                />
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                    type="text"
                                    value={editingRestaurant.cuisine || ''}
                                    onChange={(e) => setEditingRestaurant({
                                        ...editingRestaurant,
                                        cuisine: e.target.value
                                    })}
                                    required
                                />
                                <div className="flex gap-2">
                                    <button 
                                        type="submit"
                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Save
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setEditingRestaurant(null)}
                                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            // Display Mode
                            <>
                                <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
                                <p className="text-gray-600 mb-1">{restaurant.address}</p>
                                <p className="text-gray-600 mb-4">{restaurant.cuisine}</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleStartEdit(restaurant)}
                                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(restaurant.id)}
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RestaurantList; 