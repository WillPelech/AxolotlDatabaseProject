import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch restaurant details
        const restaurantResponse = await fetch(`http://localhost:5000/api/restaurants/${id}`);
        const restaurantData = await restaurantResponse.json();

        if (!restaurantResponse.ok) {
          throw new Error(restaurantData.error || 'Failed to fetch restaurant details');
        }

        if (!isMounted) return;
        setRestaurant(restaurantData.restaurant);

        // Fetch menu items
        const menuResponse = await fetch(`http://localhost:5000/api/restaurants/${id}/foods`);
        const menuData = await menuResponse.json();

        if (!menuResponse.ok) {
          throw new Error(menuData.error || 'Failed to fetch menu items');
        }

        if (!isMounted) return;
        setMenuItems(menuData.foodlist || []);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading restaurant details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Restaurant not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-64">
          <img 
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4" 
            alt={restaurant.RestaurantName} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl font-bold">{restaurant.RestaurantName}</h1>
            <p className="text-lg">
              {restaurant.Category}
              {restaurant.Rating && ` • ${restaurant.Rating}★`}
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content - Menu */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Menu</h2>
            </div>
            
            {menuItems.length > 0 ? (
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <div key={item.FoodID} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-lg font-medium">{item.FoodName}</h3>
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      ${item.Price}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No menu items available</p>
            )}
          </div>
        </div>

        {/* Sidebar - Restaurant Info */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Restaurant Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700">Address</h3>
                <p className="text-gray-600">{restaurant.Address}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Phone</h3>
                <p className="text-gray-600">{restaurant.PhoneNumber}</p>
              </div>
              <button 
                onClick={() => navigate('/suggested')}
                className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
              >
                Back to Restaurants
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Restaurant; 