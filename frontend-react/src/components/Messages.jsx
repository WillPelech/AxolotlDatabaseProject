import React, { useState, useEffect } from 'react';


const Messages = () => {
   const [messages, setMessages] = useState([]);


   useEffect(() => {
       // Simulating fetching messages
       const fetchedMessages = [
           { id: 1, text: 'Hello, World!' },
           { id: 2, text: 'Welcome to the messaging app!' },
       ];
       setMessages(fetchedMessages);
   }, []);


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


