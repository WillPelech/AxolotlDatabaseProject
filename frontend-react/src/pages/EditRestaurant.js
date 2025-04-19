import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CreateFoodModal from '../components/CreateFoodModal';

function EditRestaurant() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    RestaurantName: '',
    Category: '',
    PhoneNumber: '',
    Address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foods, setFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRestaurantDetails();
    fetchFoods();
  }, [id]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/restaurants/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.restaurant) {
        setFormData({
          RestaurantName: data.restaurant.RestaurantName,
          Category: data.restaurant.Category,
          PhoneNumber: data.restaurant.PhoneNumber,
          Address: data.restaurant.Address,
        });
      } else {
        setError(data.error || 'Failed to fetch restaurant details');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/restaurants/${id}/foods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setFoods(data.foodlist || []);
      }
    } catch (err) {
      console.error('Error fetching foods:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/restaurants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(id),
          restaurantData: {
            ...formData,
            Rating: null
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/manage-restaurants', {
          state: { message: 'Restaurant updated successfully!' }
        });
      } else {
        setError(data.error || 'Failed to update restaurant');
      }
    } catch (err) {
      setError('Error connecting to the server');
    }
  };

  const handleFoodCreated = (newFood) => {
    setFoods([...foods, newFood]);
    setSuccessMessage('Food item created successfully!');
  };

  const handleDeleteFood = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/restaurants/${id}/foods/${foodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setFoods(foods.filter(food => food.FoodID !== foodId));
        setSuccessMessage('Food item deleted successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete food item');
      }
    } catch (err) {
      setError('Error connecting to the server');
    }
  };

  const handleEditFood = async (food) => {
    setEditingFood(food);
    setShowFoodModal(true);
  };

  const handleUpdateFood = async (updatedFood) => {
    try {
      const response = await fetch(`http://localhost:5000/api/restaurants/${id}/foods/${updatedFood.FoodID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FoodName: updatedFood.FoodName,
          Price: parseFloat(updatedFood.Price)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFoods(foods.map(food => 
          food.FoodID === updatedFood.FoodID ? data.food : food
        ));
        setSuccessMessage('Food item updated successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update food item');
      }
    } catch (err) {
      setError('Error connecting to the server');
    }
  };

  if (!user || !user.isRestaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-center text-red-600">
            Access Denied
          </h2>
          <p className="text-center text-gray-600">
            Only restaurant accounts can edit restaurants.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Edit Restaurant
          </h2>

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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="RestaurantName" className="block text-sm font-medium text-gray-700">
                Restaurant Name
              </label>
              <input
                type="text"
                id="RestaurantName"
                name="RestaurantName"
                required
                value={formData.RestaurantName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter restaurant name"
              />
            </div>

            <div>
              <label htmlFor="Category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                id="Category"
                name="Category"
                required
                value={formData.Category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="e.g., Italian, Chinese, Fast Food"
              />
            </div>

            <div>
              <label htmlFor="PhoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="PhoneNumber"
                name="PhoneNumber"
                required
                value={formData.PhoneNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label htmlFor="Address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="Address"
                name="Address"
                required
                value={formData.Address}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter full address"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/manage-restaurants')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Food Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Menu Items</h3>
            <button
              onClick={() => {
                setEditingFood(null);
                setShowFoodModal(true);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
            >
              Add New Food
            </button>
          </div>

          <div className="space-y-4">
            {foods.map((food) => (
              <div key={food.FoodID} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{food.FoodName}</h4>
                  <p className="text-gray-600">${parseFloat(food.Price).toFixed(2)}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditFood(food)}
                    className="px-3 py-1 text-sm font-medium text-orange-600 bg-orange-100 rounded hover:bg-orange-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFood(food.FoodID)}
                    className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {foods.length === 0 && (
              <p className="text-gray-500 text-center">No menu items yet</p>
            )}
          </div>
        </div>
      </div>

      <CreateFoodModal
        isOpen={showFoodModal}
        onClose={() => {
          setShowFoodModal(false);
          setEditingFood(null);
        }}
        restaurantId={id}
        onFoodCreated={handleFoodCreated}
        editingFood={editingFood}
        onFoodUpdated={handleUpdateFood}
      />
    </div>
  );
}

export default EditRestaurant; 