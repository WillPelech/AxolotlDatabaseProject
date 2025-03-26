import React from 'react';
import { useParams } from 'react-router-dom';

function Restaurant() {
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-64">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4" alt="Restaurant" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl font-bold">Restaurant Name</h1>
            <p className="text-lg">Cuisine Type • $$$ • 4.5 ★</p>
          </div>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-gray-600 mb-6">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            
            <h2 className="text-2xl font-bold mb-4">Menu</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold">Starters</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Bruschetta</span>
                    <span>$8.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calamari</span>
                    <span>$12.99</span>
                  </div>
                </div>
              </div>
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold">Main Courses</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Grilled Salmon</span>
                    <span>$24.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beef Tenderloin</span>
                    <span>$29.99</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Hours</h3>
                <p className="text-gray-600">Mon-Fri: 11:00 AM - 10:00 PM</p>
                <p className="text-gray-600">Sat-Sun: 10:00 AM - 11:00 PM</p>
              </div>
              <div>
                <h3 className="font-semibold">Location</h3>
                <p className="text-gray-600">123 Restaurant Street</p>
                <p className="text-gray-600">City, State 12345</p>
              </div>
              <div>
                <h3 className="font-semibold">Contact</h3>
                <p className="text-gray-600">Phone: (555) 123-4567</p>
                <p className="text-gray-600">Email: info@restaurant.com</p>
              </div>
              <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700">
                Make Reservation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Restaurant; 