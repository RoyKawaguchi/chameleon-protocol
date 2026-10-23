import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { Message } from "./models/types";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Default Vite dev server port for React
  },
});

app.get("/", (_req, res) => {
  res.send("Chameleon Protocol server is running.");
});

const PASSCODE = "1234";
const roomName = "room_1234";
const roomMembers = new Set<string>();
const roomMessages: Message[] = [];

// Runs every time a new client connects to the server
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Read code and username sent from the frontend during connection
  const { code, username } = socket.handshake.auth;
  const playerName = username || "Anonymous";

  // If passcode is incorrect, don't allow them to enter.
  if (code !== PASSCODE) {
    console.log(
      `Access denied for ${socket.id} with username ${playerName}: Invalid code (${code})`
    );

    // Send back error message
    socket.emit("room_error", {
      message: "Wrong passcode! Access denied.",
    });
    socket.disconnect();
    return; // Stop running code for this connection
  }

  // Passcode is correct!
  // 1. Put this socket connection into a room
  socket.join(roomName);
  console.log(
    `Player ${playerName} (${socket.id}) successfully joined ${roomName}`
  );

  // add the member to the in-memory state
  roomMembers.add(playerName);

  // 2. Construct the join message
  const joinMessage: Message = {
    sender: "System",
    text: `${playerName} has entered the room.`,
    timestamp: new Date().toLocaleTimeString(),
  };

  // add message to in-memory state
  roomMessages.push(joinMessage);

  // 3. Emit a room update
  io.to(roomName).emit("room_update", {
    members: Array.from(roomMembers),
    messages: roomMessages,
  });

  // --END OF CONNECTION LOGIC---

  // Client sent a message
  socket.on("send_message", (data: { text: string }) => {
    // Uppercase the message (to prove that the server has processed it)
    const uppercaseText = data.text.toUpperCase();

    console.log(`[Chat] ${playerName}: "${data.text}" -> "${uppercaseText}"`);

    // Construct the message
    const newMessage: Message = {
      sender: playerName,
      text: uppercaseText,
      timestamp: new Date().toLocaleTimeString(),
    };

    // add message
    roomMessages.push(newMessage);

    // Emit room update
    io.to(roomName).emit("room_update", {
      members: Array.from(roomMembers),
      messages: roomMessages,
    });
  });

  // One client disconnected
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from room member list
    roomMembers.delete(playerName);

    // Construct message
    const leaveMessage: Message = {
      sender: "System",
      text: `${playerName} has left the room.`,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Add message
    roomMessages.push(leaveMessage);

    // Broadcast updated members and full messages
    io.to(roomName).emit("room_update", {
      members: roomMembers ? Array.from(roomMembers) : [],
      messages: roomMessages || [],
    });
  });
});

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
