import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function RestaurantList() {
    const [restaurants, setRestaurants] = useState([]);
    const [menuItems, setMenuItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRestaurants();
    }, []);

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/restaurants');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch restaurants');
            }

            setRestaurants(data.restaurants || []);

            // Fetch menu items for each restaurant
            const menuPromises = data.restaurants.map(restaurant =>
                fetch(`http://localhost:5000/api/restaurants/${restaurant.RestaurantID}/foods`)
                    .then(res => res.json())
                    .then(menuData => ({
                        restaurantId: restaurant.RestaurantID,
                        foods: menuData.foodlist || []
                    }))
            );

            const menuResults = await Promise.all(menuPromises);
            const menuMap = {};
            menuResults.forEach(result => {
                menuMap[result.restaurantId] = result.foods;
            });
            setMenuItems(menuMap);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl text-gray-600">Loading restaurants...</div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl text-red-600">{error}</div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Find Restaurants</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map(restaurant => (
                    <Link 
                        key={restaurant.RestaurantID} 
                        to={`/restaurant/${restaurant.RestaurantID}`}
                        className="block"
                    >
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            <div className="relative h-48">
                                <img
                                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
                                    alt={restaurant.RestaurantName}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    <h3 className="text-xl font-bold">{restaurant.RestaurantName}</h3>
                                    <p className="text-sm">{restaurant.Category}</p>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="mb-4">
                                    <p className="text-gray-600">{restaurant.Address}</p>
                                    <p className="text-gray-600">Phone: {restaurant.PhoneNumber}</p>
                                </div>
                                
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Menu Preview</h4>
                                    {menuItems[restaurant.RestaurantID]?.length > 0 ? (
                                        <div className="space-y-2">
                                            {menuItems[restaurant.RestaurantID].slice(0, 3).map(item => (
                                                <div key={item.FoodID} className="flex justify-between text-sm">
                                                    <span className="text-gray-700">{item.FoodName}</span>
                                                    <span className="text-gray-600">${item.Price}</span>
                                                </div>
                                            ))}
                                            {menuItems[restaurant.RestaurantID].length > 3 && (
                                                <p className="text-sm text-gray-500 italic">
                                                    +{menuItems[restaurant.RestaurantID].length - 3} more items...
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">No menu items available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default RestaurantList; 