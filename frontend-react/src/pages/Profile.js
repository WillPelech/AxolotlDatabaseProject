import React from 'react';

function Profile() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src="https://via.placeholder.com/150"
              alt="Profile"
              className="w-32 h-32 rounded-full"
            />
            <button className="absolute bottom-0 right-0 bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">John Doe</h1>
            <p className="text-gray-600">john.doe@example.com</p>
            <div className="mt-4 flex space-x-4">
              <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
                Edit Profile
              </button>
              <button className="bg-white text-orange-600 border border-orange-600 px-4 py-2 rounded-md hover:bg-orange-50">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Favorites */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Favorite Restaurants</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <img
                  src="https://via.placeholder.com/100"
                  alt="Restaurant"
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">Restaurant Name</h3>
                  <p className="text-gray-600">Cuisine Type • $$$ • 4.5 ★</p>
                  <p className="text-sm text-gray-500 mt-1">Last visited: 2 weeks ago</p>
                </div>
                <button className="text-orange-600 hover:text-orange-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {/* Add more favorite restaurants here */}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-orange-600" />
                    <span className="ml-2">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-orange-600" />
                    <span className="ml-2">Push notifications</span>
                  </label>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Privacy</h3>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-orange-600" />
                    <span className="ml-2">Show profile to others</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="form-checkbox text-orange-600" />
                    <span className="ml-2">Show favorites to others</span>
                  </label>
                </div>
              </div>
              <button className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile; 