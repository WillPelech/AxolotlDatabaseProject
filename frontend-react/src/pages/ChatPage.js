import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChatPage = () => {
  const { partnerId } = useParams();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch and filter chat messages
  useEffect(() => {
    const fetchChat = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/customers/messages`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.messages) {
          // Filter and then sort ascending so oldest first, newest last
          const chat = data.messages
            .filter(m =>
              (m.SenderID === user.accountId && String(m.RecipientID) === partnerId) ||
              (String(m.SenderID) === partnerId && m.RecipientID === user.accountId)
            )
            .sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp));
          setMessages(chat);
          scrollToBottom();
        }
      } catch (err) {
        console.error('Error loading chat:', err);
      }
    };
    fetchChat();
  }, [token, partnerId, user.accountId]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ recipientID: Number(partnerId), contents: newMessage })
      });
      const respData = await res.json();
      if (res.ok) {
        // Append locally with current EST timestamp
        const now = new Date();
        const estTime = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
        const newEntry = {
          MessageID: respData.messageID,
          SenderID: user.accountId,
          RecipientID: Number(partnerId),
          Timestamp: now.toISOString(),
          Contents: newMessage,
          displayTime: estTime
        };
        setMessages(prev => [...prev, newEntry]);
        setNewMessage('');
        scrollToBottom();
      } else {
        console.error('Error sending message:', respData.error || respData.message);
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Chat with User {partnerId}</h1>
      <div className="flex-1 overflow-auto p-4 bg-white rounded-lg shadow space-y-4">
        {messages.map((m) => {
          const isMine = m.SenderID === user.accountId;
          // Format timestamp: prefer displayTime if set, else convert
          const displayTime = m.displayTime || new Date(m.Timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' });
          return (
            <div key={m.MessageID} className={`${isMine ? 'justify-end' : 'justify-start'} flex` }>
              <div className={`${isMine ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'} max-w-xs p-3 rounded-lg`}>
                <p className="text-sm whitespace-pre-wrap">{m.Contents}</p>
                <div className="text-xs mt-1 text-right opacity-75">{displayTime}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="mt-4 flex">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-r hover:bg-blue-700">Send</button>
      </form>
    </div>
  );
};

export default ChatPage; 