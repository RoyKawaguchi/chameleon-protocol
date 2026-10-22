import React, { useState } from 'react';
import { JoinPayload } from '../types';

interface LoginFormProps {
  onJoin: (payload: JoinPayload) => void;
  errorMessage: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onJoin, errorMessage }) => {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomCode.trim()) return;
    
    // Hand credentials up to App.tsx
    onJoin({ username, roomCode });
  };

return (
  <form onSubmit={handleSubmit}>
    <label>Username:</label>
    <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your name" required />

    <label>Room Passcode (Try 1234):</label>
    <input type="password" value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="Passcode" required />

    <button type="submit">Enter Room</button>
    {errorMessage && <p>{errorMessage}</p>}
  </form>
);
}