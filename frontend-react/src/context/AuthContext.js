import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
        loading: true
    });

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('token');
        if (token) {
            verifyToken(token);
        } else {
            setAuthState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    const verifyToken = async (token) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': token
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAuthState({
                    isAuthenticated: true,
                    user: data.user,
                    loading: false
                });
            } else {
                localStorage.removeItem('token');
                setAuthState({
                    isAuthenticated: false,
                    user: null,
                    loading: false
                });
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('token');
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false
            });
        }
    };

    const login = async (username, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                setAuthState({
                    isAuthenticated: true,
                    user: data.user,
                    loading: false
                });
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    };

    const signup = async (userData) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Signup failed:', error);
            return { success: false, error: 'Signup failed. Please try again.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
        });
    };

    const isRestaurantOwner = () => {
        return authState.user?.type === 'restaurant';
    };

    return (
        <AuthContext.Provider value={{
            ...authState,
            login,
            signup,
            logout,
            isRestaurantOwner
        }}>
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