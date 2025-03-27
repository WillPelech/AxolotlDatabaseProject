import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../services/api';
import '../styles.css';

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
            setRestaurants(data);
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

    // Update restaurant
    const handleUpdate = async (e) => {
        e.preventDefault();
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
        if (window.confirm('Are you sure you want to delete this restaurant?')) {
            try {
                await restaurantApi.delete(id);
                loadRestaurants();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="restaurant-list">
            <h2>Restaurants</h2>
            
            {/* Add Restaurant Form */}
            <form onSubmit={handleAdd} className="add-form">
                <h3>Add New Restaurant</h3>
                <input
                    type="text"
                    placeholder="Restaurant Name"
                    value={newRestaurant.name}
                    onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                />
                <input
                    type="text"
                    placeholder="Address"
                    value={newRestaurant.address}
                    onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                />
                <input
                    type="text"
                    placeholder="Cuisine"
                    value={newRestaurant.cuisine}
                    onChange={(e) => setNewRestaurant({...newRestaurant, cuisine: e.target.value})}
                />
                <button type="submit">Add Restaurant</button>
            </form>

            {/* Restaurant List */}
            <div className="restaurants-grid">
                {restaurants.map(restaurant => (
                    <div key={restaurant.id} className="restaurant-card">
                        {editingRestaurant?.id === restaurant.id ? (
                            // Edit Form
                            <form onSubmit={handleUpdate} className="edit-form">
                                <input
                                    type="text"
                                    value={editingRestaurant.name}
                                    onChange={(e) => setEditingRestaurant({
                                        ...editingRestaurant,
                                        name: e.target.value
                                    })}
                                />
                                <input
                                    type="text"
                                    value={editingRestaurant.address}
                                    onChange={(e) => setEditingRestaurant({
                                        ...editingRestaurant,
                                        address: e.target.value
                                    })}
                                />
                                <input
                                    type="text"
                                    value={editingRestaurant.cuisine}
                                    onChange={(e) => setEditingRestaurant({
                                        ...editingRestaurant,
                                        cuisine: e.target.value
                                    })}
                                />
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setEditingRestaurant(null)}>Cancel</button>
                            </form>
                        ) : (
                            // Display Mode
                            <>
                                <h3>{restaurant.name}</h3>
                                <p>{restaurant.address}</p>
                                <p>{restaurant.cuisine}</p>
                                <div className="button-group">
                                    <button onClick={() => setEditingRestaurant(restaurant)}>Edit</button>
                                    <button onClick={() => handleDelete(restaurant.id)}>Delete</button>
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