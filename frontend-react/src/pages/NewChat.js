import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const NewChat = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !message.trim()) {
      setError('Username and message are required.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      // Lookup user by username
      const lookupRes = await fetch(`${API_URL}/customers/lookup/${username}`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const lookupData = await lookupRes.json();
      if (!lookupRes.ok) {
        throw new Error(lookupData.error || 'User not found');
      }
      const recipientId = lookupData.customerID;

      // Send initial message
      const sendRes = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipientID: recipientId, contents: message })
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        throw new Error(sendData.error || 'Failed to send message');
      }
      // Navigate to chat screen
      navigate(`/messages/${recipientId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Start a New Chat</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none"
            rows="4"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
};

export default NewChat; 