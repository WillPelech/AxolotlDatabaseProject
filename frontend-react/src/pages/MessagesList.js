import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MessagesList = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [chatPartners, setChatPartners] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/customers/messages`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.messages) {
          setMessages(data.messages);
          // Determine unique chat partners by ID and username
          const partners = data.messages.reduce((acc, m) => {
            const id = m.SenderID === user.accountId ? m.RecipientID : m.SenderID;
            const username = m.SenderID === user.accountId ? m.RecipientUsername : m.SenderUsername;
            if (!acc.find(p => p.id === id)) {
              acc.push({ id, username });
            }
            return acc;
          }, []);
          setChatPartners(partners);
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
      }
    };
    if (token) fetchMessages();
  }, [token, user.accountId]);

  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Your Chats</h1>
      <ul className="divide-y divide-gray-200">
        {chatPartners.map(p => (
          <li key={p.id} className="py-2">
            <Link to={`/messages/${p.id}`} className="text-lg text-blue-600 hover:underline">
              {p.username}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link to="/messages/new" className="text-indigo-600 hover:underline">
          + Start New Chat
        </Link>
      </div>
    </div>
  );
};

export default MessagesList; 