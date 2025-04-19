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

      // Check if the user is a customer
      if (user.accountType !== 'customer') {
        throw new Error('Only customers can place orders');
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
          CustomerID: parseInt(user.accountId),  // This should match the CustomerID in the database
          RestaurantID: parseInt(id),
          items: orderData.items.map(item => ({
            FoodID: parseInt(item.FoodID),
            quantity: parseInt(item.quantity)
          })),
          PriceTotal: parseFloat(orderData.PriceTotal),
          Additional_Costs: parseFloat(orderData.Additional_Costs)
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
      <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-neutral-600">Loading restaurant details...</div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">
            {error || 'Restaurant not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
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
        {/* Restaurant Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="relative h-48 bg-neutral-200">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">{restaurant.RestaurantName}</h1>
              <p className="text-lg text-neutral-600">{restaurant.Category}</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Address</p>
                  <p className="font-medium text-neutral-900">{restaurant.Address}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Phone</p>
                  <p className="font-medium text-neutral-900">{restaurant.PhoneNumber || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Rating</p>
                  <p className="font-medium text-neutral-900">{restaurant.Rating ? `${restaurant.Rating} / 5` : 'No ratings yet'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="w-full md:w-auto px-8 py-3 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-200 shadow-md"
            >
              Place Order
            </button>
          </div>
        </div>

        {/* Menu Section */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Menu</h2>
          {foods.length === 0 ? (
            <div className="text-center text-neutral-500 py-8">
              No menu items available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {foods.map((food) => (
                <div key={food.FoodID} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{food.FoodName}</h3>
                  <p className="text-primary font-medium">${parseFloat(food.Price).toFixed(2)}</p>
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