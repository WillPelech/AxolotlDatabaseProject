import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

function Navbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [modalMode, setModalMode] = useState('login');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-orange-600">FoodHub</span>
                        </Link>
                    </div>

                    <div className="flex items-center">
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
                                    onClick={() => {
                                        setModalMode('login');
                                        setShowAuthModal(true);
                                    }}
                                    className="bg-orange-600 text-white border-2 border-orange-600 px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => {
                                        setModalMode('signup');
                                        setShowAuthModal(true);
                                    }}
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
                accountType="customer"
                initialAuthMode={modalMode}
            />
        </nav>
    );
}

export default Navbar; 