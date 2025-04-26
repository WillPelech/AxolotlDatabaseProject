import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function CreateFoodModal({ isOpen, onClose, restaurantId, onFoodCreated, editingFood, onFoodUpdated }) {
  const { getAuthToken } = useAuth();
  const [formData, setFormData] = useState({
    foodName: '',
    price: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = (includeContentType = true) => {
    const token = getAuthToken();
    let headers = {};
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    // Initialize form data based on whether editing or creating
    if (editingFood) {
      setFormData({
        foodName: editingFood.FoodName,
        price: editingFood.Price.toString(),
      });
    } else {
      setFormData({
        foodName: '',
        price: '',
      });
    }
    // Reset loading and error states when modal opens or editing context changes
    setLoading(false);
    setError('');
  }, [editingFood, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingFood) {
        const updatedFood = {
          FoodID: editingFood.FoodID,
          FoodName: formData.foodName,
          Price: parseFloat(formData.price),
          RestaurantID: parseInt(restaurantId)
        };
        await onFoodUpdated(updatedFood);
      } else {
        const response = await fetch(`http://localhost:5000/api/restaurants/${restaurantId}/foods`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            FoodName: formData.foodName,
            Price: parseFloat(formData.price)
          }),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError("Authentication failed or permission denied.");
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create food item');
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        onFoodCreated(data.food);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      // Always reset loading state after submission attempt
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-neutral-900">
            {editingFood ? 'Edit Food Item' : 'Add New Food Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Food Name
            </label>
            <input
              type="text"
              name="foodName"
              value={formData.foodName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Price
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {loading ? (editingFood ? 'Updating...' : 'Creating...') : (editingFood ? 'Update Food' : 'Create Food')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateFoodModal; 