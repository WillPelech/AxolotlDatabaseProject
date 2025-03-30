import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, accountType = 'customer', initialAuthMode = 'login' }) => {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState(initialAuthMode);
  const { login, signup } = useAuth();

  // Update authMode when initialAuthMode changes
  useEffect(() => {
    setAuthMode(initialAuthMode);
  }, [initialAuthMode]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    accountType: accountType
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        const loginResult = await login(formData.username, formData.password);
        if (loginResult.success) {
          onClose();
          // Redirect based on account type
          if (loginResult.user.accountType === 'restaurant') {
            navigate('/manage-restaurants');
          } else {
            navigate('/');
          }
        } else {
          setError(loginResult.error || 'Login failed');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const result = await signup({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth,
          accountType: accountType
        });
        if (result.success) {
          // After successful signup, automatically log in
          const loginResult = await login(formData.username, formData.password);
          if (loginResult.success) {
            onClose();
            if (accountType === 'restaurant') {
              navigate('/manage-restaurants');
            } else {
              navigate('/');
            }
          } else {
            setError('Account created but login failed. Please try logging in.');
          }
        } else {
          setError(result.error || 'Signup failed');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {authMode === 'login' ? 'Welcome Back!' : `Create ${accountType === 'restaurant' ? 'Restaurant' : 'Customer'} Account`}
          </h2>
          <button
            onClick={onClose}
            className="text-orange-600 hover:text-orange-700 transition-colors text-xl font-semibold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              placeholder="Enter your username"
            />
          </div>

          {authMode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              placeholder="Enter your password"
            />
          </div>

          {authMode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors mb-3"
              disabled={loading}
            >
              {loading ? 'Processing...' : authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-6 text-center border-t pt-6">
          <p className="text-sm text-gray-600">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  dateOfBirth: '',
                  accountType: accountType
                });
                setError('');
              }}
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              {authMode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 