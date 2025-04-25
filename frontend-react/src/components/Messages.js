import React, { useState, useEffect } from 'react';


const Messages = () => {
   const [messages, setMessages] = useState([
       { id: 1, text: 'This is a default message to show how messages will look.' },
   ]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);


   useEffect(() => {
       const fetchMessages = async () => {
           try {
               const response = await fetch('http://localhost:5000/api/messages'); // Adjust the URL as needed
               if (!response.ok) {
                   throw new Error('Failed to fetch messages');
               }
               const data = await response.json();
               setMessages(data);
           } catch (err) {
               setError(err.message);
           } finally {
               setLoading(false);
           }
       };


       fetchMessages();
   }, []);


   if (loading) return <div>Loading messages...</div>;
   if (error) return <div>Error: {error}</div>;


   return (
       <div>
           <h1>Messages</h1>
           <ul>
               {messages.map(message => (
                   <li key={message.id}>{message.text}</li>
               ))}
           </ul>
       </div>
   );
};


export default Messages;


