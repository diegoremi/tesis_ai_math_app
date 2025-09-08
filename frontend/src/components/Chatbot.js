import React, { useState } from 'react';
import { chat } from '../services/api';
import './Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { text: input, sender: 'user' };
      setMessages([...messages, userMessage]);
      setInput('');
      setLoading(true);

      try {
        const response = await chat(input);
        const botMessage = { text: response.data.response, sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } catch (error) {
        console.error('Error sending message to chatbot:', error);
        const errorMessage = { text: 'Error: Could not get a response.', sender: 'bot' };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="chatbot-content">
      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="message bot"><div className="spinner"></div></div>}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
