import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

function Navbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [modalMode, setModalMode] = useState('login');
    const [accountType, setAccountType] = useState('customer');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleAuthClick = (mode, type = 'customer') => {
        setModalMode(mode);
        setAccountType(type);
        setShowAuthModal(true);
    };

    return (
        <nav className="w-full bg-gray-50 shadow-md relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-orange-600">FoodHub</span>
                        </Link>
                        <div className="hidden sm:flex sm:space-x-8">
                            <Link
                                to="/"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Home
                            </Link>
                            <Link
                                to="/suggested"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Find Restaurants
                            </Link>
                            <Link
                                to="/map"
                                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Map
                            </Link>
                            {user && user.isRestaurant && (
                                <>
                                    <Link
                                        to="/create-restaurant"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Create Restaurant
                                    </Link>
                                    <Link
                                        to="/manage-restaurants"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Manage Restaurants
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700">
                                    {user.username} ({user.accountType === 'restaurant' ? 'Restaurant Account' : 'Customer Account'})
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-orange-600 text-white border-2 border-orange-600 px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => handleAuthClick('signup', 'restaurant')}
                                    className="bg-orange-600 text-white border-2 border-orange-600 px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                >
                                    Create Restaurant Account
                                </button>
                                <button
                                    onClick={() => handleAuthClick('login')}
                                    className="bg-orange-600 text-white border-2 border-orange-600 px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => handleAuthClick('signup')}
                                    className="bg-orange-600 text-white border-2 border-orange-600 px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                initialAuthMode={modalMode}
                accountType={accountType}
            />
        </nav>
    );
}

export default Navbar; 