import React, { useState, useEffect } from 'react';

const Chat = ({ socket, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (socket) {
      socket.on('chat-message', (data) => {
        setMessages(prev => [...prev, { message: data.message, from: data.from }]);
      });
    }

    return () => {
      if (socket) {
        socket.off('chat-message');
      }
    };
  }, [socket]);

  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('chat-message', { message: newMessage, roomId });
      setMessages(prev => [...prev, { message: newMessage, from: 'You' }]);
      setNewMessage('');
    }
  };

  return (
    <div className="chat-container">
      <h3>💬 Chat</h3>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong>{msg.from}:</strong> {msg.message}
            </div>
          ))
        )}
      </div>
      <div className="chat-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="chat-input"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="chat-send-btn">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;