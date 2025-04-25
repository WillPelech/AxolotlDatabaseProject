import React, { useState, useRef, useEffect } from 'react';

function AddressListItem({ address, onDelete, onEdit, isDeleting, isEditing }) {
    const [editMode, setEditMode] = useState(false);
    const [editedAddress, setEditedAddress] = useState(address);
    const inputRef = useRef(null); // Ref for the input element

    // Focus input when edit mode is enabled
    useEffect(() => {
        if (editMode && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select(); // Select text for easy replacement
        }
    }, [editMode]);

    const handleSave = () => {
        if (editedAddress.trim() && editedAddress !== address) {
            onEdit(address, editedAddress); // Pass old and new address
        }
        setEditMode(false);
    };

    const handleCancel = () => {
        setEditedAddress(address); // Reset to original address
        setEditMode(false);
    };

    const handleDelete = () => {
        onDelete(address);
    };

    // Handle Enter key press in input field to save
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <li className="flex justify-between items-center bg-white p-4 border border-gray-200 rounded-md shadow-sm hover:shadow transition duration-150 ease-in-out min-h-[60px]">
            {editMode ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editedAddress}
                    onChange={(e) => setEditedAddress(e.target.value)}
                    onBlur={handleSave} // Save when input loses focus
                    onKeyPress={handleKeyPress} // Save on Enter key
                    className="flex-grow mr-4 px-2 py-1 border border-primary rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
            ) : (
                <span className="text-gray-900 flex-grow mr-4 break-words">{address}</span>
            )}

            <div className="flex-shrink-0 flex items-center space-x-2">
                {editMode ? (
                    <>
                        <button
                            onClick={handleSave}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded disabled:opacity-50"
                            aria-label={`Save changes to address ${address}`}
                            disabled={!editedAddress.trim() || editedAddress === address || isEditing}
                        >
                            {/* Checkmark Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            aria-label="Cancel editing"
                        >
                             {/* Cancel Icon (X) */}
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                             </svg>
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setEditMode(true)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded disabled:opacity-50"
                            aria-label={`Edit address ${address}`}
                            disabled={isDeleting || isEditing} // Disable if any operation is in progress
                        >
                            {/* Edit Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded disabled:opacity-50"
                            aria-label={`Delete address ${address}`}
                            disabled={isDeleting || isEditing} // Disable if any operation is in progress
                        >
                           {/* Delete Icon */}
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                        </button>
                    </>
                )}
            </div>
        </li>
    );
}

export default AddressListItem; 