import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        Welcome to FoodHub
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Discover amazing restaurants in your area
      </p>
      <div className="space-x-4">
        <Link
          to="/suggested"
          className="bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700"
        >
          Find Restaurants
        </Link>
        <Link
          to="/map"
          className="bg-white text-orange-600 border border-orange-600 px-6 py-3 rounded-md hover:bg-orange-50"
        >
          View Map
        </Link>
      </div>
    </div>
  );
}

export default Home; 