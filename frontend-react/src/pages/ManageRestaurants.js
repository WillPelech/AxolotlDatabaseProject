import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ManageRestaurants() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  useEffect(() => {
    fetchRestaurants();
  }, [user]);

  const fetchRestaurants = async () => {
    setError('');
    setSuccessMessage('');
    try {
      if (!user || !user.accountId || !user.isRestaurant) {
        setError('Please log in as a restaurant owner to manage restaurants');
        setRestaurants([]);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/restaurants/account/${user.accountId}`);
      const data = await response.json();
      
      if (response.ok) {
        setRestaurants(data.restaurants || []);
      } else {
        setError(data.error || 'Failed to fetch restaurants');
        setRestaurants([]);
      }
    } catch (err) {
      console.error("Fetch restaurants error:", err);
      setError('Error connecting to the server');
      setRestaurants([]);
    }
  };

  const handleDelete = async (restaurantId) => {
    if (!window.confirm('Are you sure you want to delete this restaurant?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        // Remove the deleted restaurant from the state
        setRestaurants(restaurants.filter(r => r.RestaurantID !== restaurantId));
      } else {
        setError(data.error || 'Failed to delete restaurant');
      }
    } catch (err) {
      setError('Error connecting to the server');
    }
  };

  if (!user || !user.isRestaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-center text-red-600">Access Denied</h2>
          <p className="text-center text-gray-600">
            Only restaurant accounts can manage restaurants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Manage Your Restaurants</h1>
          <button
            onClick={() => navigate('/create-restaurant')}
            className="btn-primary"
          >
            Create New Restaurant
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {restaurants.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            No restaurants found. Create your first restaurant to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div key={restaurant.RestaurantID} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-2">{restaurant.RestaurantName}</h2>
                <p className="text-neutral-600 mb-2">{restaurant.Category}</p>
                <p className="text-neutral-600 mb-4">{restaurant.Address}</p>
                <div className="flex justify-end space-x-3">
                  <Link
                    to={`/reviews/${restaurant.RestaurantID}`}
                    className="btn-secondary px-4 rounded-md inline-flex items-center"
                  >
                    View Reviews
                  </Link>
                  <button
                    onClick={() => navigate(`/edit-restaurant/${restaurant.RestaurantID}`)}
                    className="btn-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(restaurant.RestaurantID)}
                    className="btn-primary"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageRestaurants; 