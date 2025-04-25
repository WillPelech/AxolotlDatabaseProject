import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'authToken';
const USER_INFO_KEY = 'user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY)); // Load token initially
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load: Check for stored user and token
    const storedUser = localStorage.getItem(USER_INFO_KEY);
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (storedUser && storedToken) {
        try {
             // Basic check if user data is valid JSON
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
             // Optionally: Add a call here to a lightweight backend endpoint 
             // (e.g., /api/auth/check) to verify the token is still valid 
             // and the user exists, otherwise call logout().
        } catch (e) {
             console.error("Error parsing stored user data:", e);
             // Clear invalid stored data
             localStorage.removeItem(USER_INFO_KEY);
             localStorage.removeItem(AUTH_TOKEN_KEY);
        }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) { // Check for token in response
        throw new Error(data.error || 'Login failed or token missing');
      }

      // Store user data and token
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.user));
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      
      return {
        success: true,
        user: data.user
      };
    } catch (error) {
      console.error('Login error:', error);
      // Clear any potentially partially stored items on login failure
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setToken(null);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const signup = async (formData) => {
     // Signup remains mostly the same, it doesn't log the user in directly
     // It returns success/error, AuthModal handles calling login after success.
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      return { success: true }; 

    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // Potentially redirect or update UI state here
  };

  // Function to get the current token
  const getAuthToken = () => {
     return token;
  };

  if (loading) {
    // Render loading state or null while checking auth status
    return <div>Loading Authentication...</div>; 
  }

  return (
    // Provide user, login, logout, signup, and getAuthToken
    <AuthContext.Provider value={{ user, token, login, logout, signup, getAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 