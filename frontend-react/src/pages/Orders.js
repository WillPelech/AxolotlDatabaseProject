import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !user.accountId) {
        setError('Please log in to view your orders');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/orders/customer/${user.accountId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders; 