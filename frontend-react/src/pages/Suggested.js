import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { restaurantApi } from '../services/api';

function Suggested() {
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState(null);

  const cuisines = [
    'all',
    'italian',
    'japanese',
    'mexican',
    'indian',
    'chinese',
    'american',
    'mediterranean',
    'thai',
    'vietnamese'
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '$', label: '$' },
    { value: '$$', label: '$$' },
    { value: '$$$', label: '$$$' },
    { value: '$$$$', label: '$$$$' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await restaurantApi.getAll();
        setRestaurants(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [selectedCuisine, priceRange]); // Only re-fetch when filters change

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuisine Type
            </label>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              {cuisines.map((cuisine) => (
                <option key={cuisine} value={cuisine}>
                  {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            >
              {priceRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Restaurant Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/restaurant/1" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
            alt="Restaurant"
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">Restaurant 1</h3>
            <p className="text-gray-600 mb-2">Cuisine Type • $$$ • 4.5 ★</p>
            <p className="text-sm text-gray-500 mb-4">123 Restaurant Street, City, State</p>
            <div className="flex items-center justify-between">
              <span className="text-orange-600 font-medium">Open Now</span>
              <button className="text-orange-600 hover:text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </Link> */}

        {/* Add more restaurant cards here */}
        {/* This next part will iterate through all the restaurants when */}
        {restaurants.restaurants?.length > 0
        ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {restaurants.restaurants.map((restaurant) => (
          <Link to="/restaurant/1" className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
            alt="Restaurant"
            className="w-full h-48 object-cover"
          />

          <div className="p-4">
            <h3 className="text-xl font-semibold mb-2">{restaurant.RestaurantName}</h3>
            <p className="text-gray-600 mb-2">{restaurant.Category} • $$$ • {restaurant.Rating} ★</p>
            <p className="text-sm text-gray-500 mb-4">{restaurant.Address}</p>
            <div className="flex items-center justify-between">
              {/* <span className="text-orange-600 font-medium">Open now would need some difficult logic with gettin the hours then calculating the current time</span> */}
              <button className="text-orange-600 hover:text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </Link>
        ))} 
          </div>
         
        ) : (
          <div className="empty"> </div>
        ) }

      {/* Pagination */}
      <div className="mt-8 flex justify-center">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            Previous
          </button>
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-orange-600 text-sm font-medium text-white">
            1
          </button>
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            2
          </button>
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            3
          </button>
          <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}

export default Suggested; 