import React, { useState } from "react";
import { JoinPayload } from "../models/types";

interface LoginFormProps {
  onJoin: (payload: JoinPayload) => void; // this is a function passed by App.tsx
  errorMessage: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onJoin,
  errorMessage,
}) => {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomCode.trim()) return;

    // Hand credentials up to App.tsx, which implements the join function.
    onJoin({ username, roomCode });
  };

  // A bit messy. Maybe we can use some pre-made React template for forms like this?
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label>Username:</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label>Room Passcode (Try 1234):</label>
          <input
            type="password"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Passcode"
            required
          />
        </div>

        <button type="submit">Enter Room</button>
        {errorMessage && <p>{errorMessage}</p>}
      </form>
    </div>
  );
};
