import React, { useState } from "react";
import { Message } from "../models/types";

export interface ChatRoomProps {
  username: string;
  members: Set<string>;
  roomCode: string;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onLeave: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  username,
  members,
  roomCode,
  messages,
  onSendMessage,
  onLeave,
}) => {
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText);
    setInputText(""); // Clear input
  };

  return (
    <div style={{ padding: "10px", maxWidth: "600px", margin: "0 auto" }}>
      {/* Header Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        <div>
          <strong>Room:</strong> {roomCode} | <strong>User:</strong> {username}
        </div>
        <button onClick={onLeave}>Leave</button>
      </div>

      {/* Members Section */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        <strong>Members ({members.size}):</strong>{" "}
        {Array.from(members).join(", ")}
      </div>

      {/* Messages Area */}
      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "12px",
          marginBottom: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              borderBottom: "1px solid #eee",
              paddingBottom: "6px",
            }}
          >
            <span style={{ fontSize: "0.85em", color: "#666" }}>
              [{msg.timestamp}]{" "}
            </span>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button type="submit" style={{ padding: "8px 16px" }}>
          Send
        </button>
      </form>
    </div>
  );
};
