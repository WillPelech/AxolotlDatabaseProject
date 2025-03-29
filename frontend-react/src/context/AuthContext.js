import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
    const [accountType, setAccountType] = useState('customer'); // 'customer' or 'restaurant'

    // Load user from localStorage on initial render
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const isAuthenticated = () => {
        return !!user;
    };

    const isRestaurantOwner = () => {
        return user && user.isRestaurant;
    };

    const login = async (usernameOrEmail, password) => {
        try {
            setError(null);
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usernameOrEmail,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.user) {
                const userData = {
                    ...data.user,
                    isAuthenticated: true
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Log for debugging
                console.log('Account type:', userData.accountType);
                console.log('Is Restaurant account:', userData.isRestaurant);
                
                return { success: true };
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed');
            return { success: false, error: err.message };
        }
    };

    const signup = async (signupData) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const value = {
        user,
        error,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
        accountType,
        setAccountType,
        login,
        signup,
        logout,
        isAuthenticated,
        isRestaurantOwner
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 