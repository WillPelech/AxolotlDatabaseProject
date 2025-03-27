import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

function Home() {
  const navigate = useNavigate();
  const { showAuthModal, setShowAuthModal, setAuthMode, setAccountType } = useAuth();

  const handleGetStarted = () => {
    setAccountType('restaurant');
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-orange-600 mb-4">
              FoodHub
            </h1>
            <p className="text-2xl text-gray-600">
              Your Ultimate Food Discovery Platform
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-lg text-gray-600 mb-8">
              Discover amazing restaurants, explore local cuisines, and find your next favorite meal.
              Whether you're a foodie or a restaurant owner, FoodHub has something for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Find Restaurants</h3>
              <p className="text-gray-600 mb-4">Discover the best local restaurants in your area</p>
              <Link
                to="/suggested"
                className="inline-block bg-orange-600 text-white border-2 border-orange-600 px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                Explore
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">View Map</h3>
              <p className="text-gray-600 mb-4">See restaurant locations on an interactive map</p>
              <Link
                to="/map"
                className="inline-block bg-orange-600 text-white border-2 border-orange-600 px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                Open Map
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Restaurant Owners</h3>
              <p className="text-gray-600 mb-4">Manage your restaurant and reach more customers</p>
              <button
                onClick={handleGetStarted}
                className="w-full flex items-center justify-center px-8 py-3 border-2 border-orange-600 text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 md:py-4 md:text-lg md:px-10 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose FoodHub?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-2">For Customers</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Discover new restaurants</li>
                  <li>• Read authentic reviews</li>
                  <li>• Find the best deals</li>
                  <li>• Easy navigation</li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-2">For Restaurants</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Manage your profile</li>
                  <li>• Update menu items</li>
                  <li>• Track customer feedback</li>
                  <li>• Boost visibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal />
    </div>
  );
}

export default Home; 