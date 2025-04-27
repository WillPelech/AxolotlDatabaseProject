import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';


const Messages = () => {
   const { token } = useAuth();
   const [messages, setMessages] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);


   useEffect(() => {
       const fetchMessages = async () => {
           try {
               const response = await fetch('http://localhost:5000/api/customers/messages', {
                   headers: {
                       'Content-Type': 'application/json',
                       'Authorization': `Bearer ${token}`,
                   },
               });
               const data = await response.json();
               if (!response.ok) {
                   throw new Error(data.error || data.message || 'Failed to fetch messages');
               }
               setMessages(data.messages);
           } catch (err) {
               setError(err.message);
           } finally {
               setLoading(false);
           }
       };


       fetchMessages();
   }, [token]);


   if (loading) return <div>Loading messages...</div>;
   if (error) return <div>Error: {error}</div>;


   return (
       <div>
           <h1>Messages</h1>
           <ul>
               {messages.map(message => (
                   <li key={message.MessageID}>{message.Contents}</li>
               ))}
           </ul>
       </div>
   );
};


export default Messages;


