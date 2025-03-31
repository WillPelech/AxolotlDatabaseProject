import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OrderModal from '../components/OrderModal';

const Restaurant = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        // First fetch restaurant data
        const restaurantResponse = await fetch(`http://localhost:5000/api/restaurants/${id}`);
        const restaurantData = await restaurantResponse.json();
        
        console.log('Raw restaurant response:', restaurantResponse);
        console.log('Restaurant data:', restaurantData);

        if (!restaurantResponse.ok) {
          throw new Error(`Restaurant fetch failed: ${restaurantData.error || restaurantResponse.statusText}`);
        }

        if (!restaurantData.restaurant) {
          throw new Error('Restaurant data not found in response');
        }

        // Only fetch foods if we got the restaurant
        const foodsResponse = await fetch(`http://localhost:5000/api/restaurants/${id}/foods`);
        const foodsData = await foodsResponse.json();
        
        console.log('Raw foods response:', foodsResponse);
        console.log('Foods data:', foodsData);

        if (!foodsResponse.ok) {
          throw new Error(`Foods fetch failed: ${foodsData.error || foodsResponse.statusText}`);
        }

        setRestaurant(restaurantData.restaurant);
        setFoods(Array.isArray(foodsData.foodlist) ? foodsData.foodlist : []);
      } catch (err) {
        console.error('Detailed error:', err);
        setError(err.message || 'Failed to load restaurant data');
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRestaurantData();
    }
  }, [id]);

  const handleOrderSubmit = async (orderData) => {
    try {
      // Check if user is logged in
      if (!user || !user.accountId) {
        throw new Error('Please log in to place an order');
      }

      // Log the order data for debugging
      console.log('Order data received:', orderData);
      console.log('Current user:', user);

      // Create a single order with all items
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CustomerID: parseInt(user.accountId),
          RestaurantID: parseInt(id),
          items: orderData.items.map(item => ({
            FoodID: parseInt(item.FoodID),
            quantity: parseInt(item.quantity)
          })),
          PriceTotal: parseFloat(orderData.PriceTotal),  // Just the food items total
          Additional_Costs: parseFloat(orderData.Additional_Costs)  // Additional costs
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const result = await response.json();
      console.log('Order created:', result);

      // Close the modal
      setIsOrderModalOpen(false);

      // Show success message
      setSuccessMessage(`Order #${result.orderID} has been placed successfully!`);

    } catch (err) {
      console.error('Error placing order:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading restaurant details...</div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">
            {error || 'Restaurant not found'}
          </div>
        </div>
      </div>
    );
  }

  // Debug log to check user object
  console.log('Current user:', user);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg shadow-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{restaurant.RestaurantName}</h1>
              <p className="text-gray-600 text-lg mb-2">{restaurant.Category}</p>
              <p className="text-gray-600 mb-2">{restaurant.Address}</p>
              <p className="text-gray-600 mb-2">Rating: {restaurant.Rating || 'N/A'}</p>
              <p className="text-gray-600">Phone: {restaurant.PhoneNumber || 'N/A'}</p>
            </div>
            {user && user.accountType === 'customer' && (
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="w-full md:w-auto px-8 py-3 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 transition-colors duration-200 shadow-md"
              >
                Place Order
              </button>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
            {user && user.accountType === 'customer' && (
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 shadow-md"
              >
                Place Order
              </button>
            )}
          </div>
          {foods.length === 0 ? (
            <div className="text-center text-gray-500">
              No menu items available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foods.map((food) => (
                <div key={food.FoodID} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-gray-900">{food.FoodName}</h3>
                  <p className="text-orange-500 font-medium">${parseFloat(food.Price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        restaurant={restaurant}
        foods={foods}
        onSubmit={handleOrderSubmit}
      />
    </div>
  );
};

export default Restaurant; 