import React, { useState } from 'react';
import { ChatRoomProps } from '../types';



export const ChatRoom: React.FC<ChatRoomProps> = ({
  username,
  roomCode,
  messages,
  onSendMessage,
  onLeave,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText(''); // Clear input
  };

  return (
  <div>
    <div>
      <strong>Room:</strong> {roomCode} | <strong>User:</strong> {username}
      <button onClick={onLeave}>Leave</button>
    </div>

    <div style={{ height: '250px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
      {messages.map((msg, index) => (
        <div key={index}>
          [{msg.timestamp}] <strong>{msg.sender}:</strong> {msg.text}
        </div>
      ))}
    </div>

    <form onSubmit={handleSend}>
      <input
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        placeholder="Type a message..."
      />
      <button type="submit">Send</button>
    </form>
  </div>
);
};