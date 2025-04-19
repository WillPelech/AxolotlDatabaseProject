import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
                            <span className="text-2xl font-bold text-primary">FoodHub</span>
                        </Link>
                        <div className="hidden sm:flex sm:space-x-8">
                            <Link
                                to="/"
                                className="border-transparent text-neutral-600 hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Home
                            </Link>
                            <Link
                                to="/suggested"
                                className="border-transparent text-neutral-600 hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Find Restaurants
                            </Link>
                            <Link
                                to="/map"
                                className="border-transparent text-neutral-600 hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                            >
                                Map
                            </Link>
                            {user && user.accountType === 'restaurant' && (
                                <Link
                                    to="/manage-restaurants"
                                    className="border-transparent text-neutral-600 hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    Manage Restaurants
                                </Link>
                            )}
                            {user && user.accountType === 'customer' && (
                                <Link
                                    to="/orders"
                                    className="border-transparent text-neutral-600 hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                >
                                    My Orders
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-neutral-600">
                                    {user.username} ({user.accountType === 'restaurant' ? 'Restaurant Account' : 'Customer Account'})
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="btn-primary"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => handleAuthClick('signup', 'restaurant')}
                                    className="btn-primary"
                                >
                                    Create Restaurant Account
                                </button>
                                <button
                                    onClick={() => handleAuthClick('login')}
                                    className="btn-primary"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => handleAuthClick('signup')}
                                    className="btn-primary"
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