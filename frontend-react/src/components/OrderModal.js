import React, { useState } from 'react';

const OrderModal = ({ isOpen, onClose, restaurant, foods, onSubmit }) => {
  const [selectedItems, setSelectedItems] = useState({});
  const [additionalFees, setAdditionalFees] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleQuantityChange = (food, quantity) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      if (quantity <= 0) {
        delete newItems[food.FoodID];
      } else {
        newItems[food.FoodID] = {
          ...food,
          quantity: quantity
        };
      }
      return newItems;
    });
  };

  const calculateTotal = () => {
    const itemsTotal = Object.values(selectedItems).reduce(
      (sum, item) => sum + (parseFloat(item.Price) * item.quantity),
      0
    );
    const fees = parseFloat(additionalFees) || 0;
    return (itemsTotal + fees).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent form submission
    
    // Prevent submission if no items are selected
    if (Object.keys(selectedItems).length === 0) {
      setError('Please select at least one item');
      return;
    }

    // Format the items with proper data types
    const items = Object.values(selectedItems).map(item => ({
      FoodID: parseInt(item.FoodID),
      price: parseFloat(item.Price),
      quantity: parseInt(item.quantity),
      name: item.FoodName // Include name for reference
    }));

    // Calculate items total
    const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Parse additional costs (default to 0 if empty or invalid)
    const additionalCostsValue = parseFloat(additionalFees) || 0;

    // Calculate final total
    const total = itemsTotal + additionalCostsValue;

    console.log('Submitting items:', items);
    console.log('Items total:', itemsTotal);
    console.log('Additional costs:', additionalCostsValue);
    console.log('Final total:', total);

    // Call onSubmit with formatted items and calculated totals
    onSubmit({
      items,
      Additional_Costs: additionalCostsValue,
      PriceTotal: itemsTotal,  // This is just the food items total
      total: total  // This is the grand total including additional costs
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Place Order</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
            <h3 className="text-lg font-semibold mb-2">Select Items</h3>
            <div className="space-y-2">
              {foods.map((food) => (
                <div key={food.FoodID} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                  <div>
                    <h4 className="font-medium">{food.FoodName}</h4>
                    <p className="text-gray-600">${parseFloat(food.Price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(food, (selectedItems[food.FoodID]?.quantity || 0) - 1)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">
                        {selectedItems[food.FoodID]?.quantity || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(food, (selectedItems[food.FoodID]?.quantity || 0) + 1)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                    {selectedItems[food.FoodID]?.quantity > 0 && (
                      <p className="text-sm text-gray-600">
                        Total: ${(parseFloat(food.Price) * selectedItems[food.FoodID].quantity).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Fees (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={additionalFees}
              onChange={(e) => setAdditionalFees(e.target.value)}
              className="w-full p-2 border rounded focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter amount"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Total:</span>
              <span className="text-xl font-bold text-orange-500">${calculateTotal()}</span>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Place Order
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal; 