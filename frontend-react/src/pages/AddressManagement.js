import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios'; // Removed axios
import { useAuth } from '../contexts/AuthContext';
import AddAddressForm from '../components/AddAddressForm'; // Import form component
import AddressListItem from '../components/AddressListItem'; // Import list item component

// Make sure this points to your running backend API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'; 

function AddressManagement() {
    const { user, token } = useAuth(); // Get user and token from context
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // General loading for fetch
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading for add/edit/delete actions
    const [error, setError] = useState(null);

    // --- Helper function for fetch calls ---
    const makeApiRequest = useCallback(async (url, method = 'GET', body = null) => {
        if (!token) throw new Error("Authentication token not found.");
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const config = {
            method: method,
            headers: headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }
        
        console.log(`[AddressManagement] Making ${method} request to ${url} with body:`, body); // Log request

        const response = await fetch(url, config);
        
        console.log(`[AddressManagement] Response status: ${response.status}`); // Log status

        // Attempt to parse JSON regardless of status for error messages
        let responseData;
        try {
            responseData = await response.json();
            console.log("[AddressManagement] Response data:", responseData); // Log data
        } catch (jsonError) {
            // If response body is not JSON or empty
             console.warn("[AddressManagement] Response body is not JSON or empty.");
            responseData = null; 
        }

        if (!response.ok) {
            // Use error message from response body if available, otherwise use status text
            const errorMessage = responseData?.error || responseData?.message || response.statusText || `HTTP error! status: ${response.status}`;
            console.error(`[AddressManagement] API Error (${response.status}):`, errorMessage);
            throw new Error(errorMessage);
        }

        return responseData; // Return parsed JSON data on success

    }, [token]);

    // --- Fetch Addresses ---
    const fetchAddresses = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await makeApiRequest(`${API_URL}/customers/address`);
            setAddresses(data || []); 
        } catch (err) {
            setError(err.message);
            setAddresses([]); 
        } finally {
            setIsLoading(false);
        }
    }, [token, makeApiRequest]);

    useEffect(() => {
        // Fetch addresses when the component mounts and token is available
        if (token) { 
            fetchAddresses();
        }
        // Clear addresses if the user logs out (token becomes null)
        if (!token) {
            setAddresses([]);
        }
    }, [token, fetchAddresses]); 

    const handleAddAddress = async (newAddress) => {
        if (!newAddress.trim() || !token) return;
        setError(null);
        setIsSubmitting(true);
        try {
            const data = await makeApiRequest(`${API_URL}/customers/address`, 'POST', { address: newAddress });
            if (data && data.address) {
                 setAddresses(prevAddresses => [...prevAddresses, data.address]);
            } else {
                 fetchAddresses(); // Refetch as fallback
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditAddress = async (oldAddress, newAddress) => {
        if (!newAddress.trim() || !token || oldAddress === newAddress) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await makeApiRequest(`${API_URL}/customers/address`, 'PUT', {
                old_address: oldAddress,
                new_address: newAddress
            });
            setAddresses(prevAddresses => 
                prevAddresses.map(addr => addr === oldAddress ? newAddress : addr)
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAddress = async (addressToDelete) => {
        if (!token) return;
        setError(null);
        setIsSubmitting(true);
        try {
            await makeApiRequest(`${API_URL}/customers/address`, 'DELETE', { address: addressToDelete });
            setAddresses(prevAddresses => prevAddresses.filter(addr => addr !== addressToDelete)); 
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Conditional rendering based on auth state and loading
    if (!user) { // Check for user object from context
        return <div className="container mx-auto p-4 text-center text-gray-600">Please log in to manage your addresses.</div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-3xl bg-white shadow-lg rounded-lg mt-10 border border-gray-200">
            <h1 className="text-3xl font-bold text-primary mb-8 border-b pb-3">Manage Addresses</h1>

            {/* Error Display */}
            {error && (
                <div 
                    className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded relative mb-6 shadow"
                    role="alert"
                >
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}

            {/* Use the AddAddressForm component */}
            <AddAddressForm onAddressAdded={handleAddAddress} isLoading={isSubmitting} />

            {/* Address List Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-5">Your Addresses</h2>
                {isLoading ? (
                    <p className="text-center text-gray-500">Loading addresses...</p>
                ) : addresses.length > 0 ? (
                    <ul className="space-y-3">
                        {addresses.map((address, index) => (
                            <AddressListItem 
                                key={index} 
                                address={address} 
                                onDelete={handleDeleteAddress} 
                                onEdit={handleEditAddress} 
                                isDeleting={isSubmitting} // Pass submitting state
                                isEditing={isSubmitting}  // Pass submitting state
                            />
                        ))}
                    </ul>
                ) : !error ? ( // Only show "no addresses" if not loading and no error occurred
                    <p className="text-center text-gray-500 bg-gray-50 p-4 rounded-md border">You haven't added any addresses yet.</p>
                ) : null}
            </div>
        </div>
    );
}

export default AddressManagement; 