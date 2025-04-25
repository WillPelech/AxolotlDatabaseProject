import React, { useState } from 'react';

function AddAddressForm({ onAddressAdded, isLoading }) {
    const [newAddress, setNewAddress] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newAddress.trim()) return;
        onAddressAdded(newAddress); // Call the callback prop
        setNewAddress(''); // Clear the input after submission
    };

    return (
        <form onSubmit={handleSubmit} className="mb-10 bg-gray-50 p-6 rounded-md border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Address</h2>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-grow">
                    <label htmlFor="newAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                    </label>
                    <input
                        id="newAddress"
                        type="text"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="e.g., 123 Main St, Anytown, CA 91234"
                        required
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-focus focus:border-primary-focus transition duration-150 ease-in-out sm:text-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary px-6 py-2 text-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newAddress.trim() || isLoading} // Disable during loading from parent
                >
                    {isLoading ? 'Adding...' : 'Add Address'}
                </button>
            </div>
        </form>
    );
}

export default AddAddressForm; 