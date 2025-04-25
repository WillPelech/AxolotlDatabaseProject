import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ReviewModal from '../components/ReviewModal';

const Orders = () => {
  const { user, getAuthToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const getAuthHeaders = (includeContentType = true) => {
    const token = getAuthToken();
    console.log("[Auth Debug Frontend] Token retrieved in getAuthHeaders:", token ? `${token.substring(0, 10)}...` : null);
    let headers = {};
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    console.log("[Auth Debug Frontend] Generated Headers:", headers);
    return headers;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.accountId) {
        setError('Please log in to view your orders');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const headers = getAuthHeaders(false);
        console.log("[Auth Debug Frontend] Fetching orders with headers:", headers);
        const response = await fetch(`http://localhost:5000/api/orders/customer`, {
          headers: headers
        });

        if (!response.ok) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Authentication failed. Please log in again.";
          } else {
            try {
              // Try to parse potential JSON error body
              const errorData = await response.json();
              errorMsg = errorData.error || JSON.stringify(errorData);
            } catch (jsonError) {
              // If JSON parsing fails, read as text
              console.warn("Response was not JSON, reading as text.");
              try {
                errorMsg = await response.text(); 
              } catch (textError) {
                console.error("Failed to read error response as text:", textError);
                // Keep the original HTTP status error message
              }
            }
          }
          throw new Error(errorMsg); // Throw the determined error message
        }
        
        // Only parse JSON here if response was OK
        const data = await response.json(); 
        setOrders(data || []); // Ensure data exists, default to empty array

      } catch (err) {
        console.error("Fetch orders error:", err); // Log the actual error caught
        setError(err.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, getAuthToken]);

  const handleReviewClick = (restaurantId, restaurantName) => {
    setSelectedRestaurant({ id: restaurantId, name: restaurantName });
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = async ({ rating, content }) => {
    try {
      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

      if (!selectedRestaurant || !user || !user.accountId) {
        throw new Error("Missing data required to submit review.");
      }

      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          CustomerID: user.accountId,
          RestaurantID: selectedRestaurant.id,
          Rating: rating,
          ReviewContent: content,
          Date: formattedDate
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError("Authentication failed or permission denied. Please log in again.");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create review');
        }
      }

      setShowReviewModal(false);
      setSelectedRestaurant(null);
      setSuccessMessage('Review submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("Review submission error:", err);
      setError(`Failed to submit review: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading your orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-600">You haven't placed any orders yet.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">My Orders</h1>
        
        {error && (
          <div className="mb-4 text-red-600 text-center">{error}</div>
        )}
        
        {successMessage && (
          <div className="mb-4 text-green-600 text-center">{successMessage}</div>
        )}
        
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.OrderID} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="bg-orange-500 text-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Order #{order.OrderID}</h2>
                  <div className="text-right">
                    <div className="text-sm">Items Total: ${parseFloat(order.PriceTotal).toFixed(2)}</div>
                    {order.Additional_Costs > 0 && (
                      <div className="text-sm">Additional Costs: ${parseFloat(order.Additional_Costs).toFixed(2)}</div>
                    )}
                    <div className="text-lg font-semibold mt-1">
                      Total: ${(parseFloat(order.PriceTotal) + parseFloat(order.Additional_Costs || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>
                <p className="text-sm mt-1">Restaurant: {order.RestaurantName}</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.FoodName}</p>
                        <p className="text-sm text-gray-600">
                          ${parseFloat(item.Price).toFixed(2)} × {item.Quantity}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${(parseFloat(item.Price) * item.Quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => handleReviewClick(order.RestaurantID, order.RestaurantName)}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  >
                    Write Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRestaurant && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRestaurant(null);
          }}
          restaurantId={selectedRestaurant.id}
          restaurantName={selectedRestaurant.name}
          customerId={user.accountId}
          onSubmit={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default Orders; 