import React from 'react';
import { Link } from 'react-router-dom';

function RestaurantCard({ restaurant, onDelete }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
      <p className="text-gray-600 mb-1">{restaurant.address}</p>
      <p className="text-gray-600 mb-4">{restaurant.cuisine}</p>
      <div className="flex gap-2">
        <Link
          to={`/restaurant/${restaurant.id}`}
          className="bg-orange-600 text-white hover:bg-orange-700 font-medium py-2 px-4 rounded transition-colors"
        >
          View Details
        </Link>
        <button
          onClick={() => onDelete(restaurant.id)}
          className="bg-red-600 text-white hover:bg-red-700 font-medium py-2 px-4 rounded transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default RestaurantCard; 