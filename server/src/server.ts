import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

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

// For now, let's say the passcode is hardcoded to 1234.
const PASSCODE = "1234";

// Runs every time a new client connects to the server
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // 1. Read code and username sent from the frontend during connection
  const { code, username } = socket.handshake.auth;
  const playerName = username || "Anonymous";

  // 2. Validate code
  if (code !== PASSCODE) {
    console.log(`Access denied for ${socket.id} with username ${playerName}: Invalid code (${code})`);
    
    // Tell the specific client why they failed, then disconnect them
    socket.emit("room_error", { message: "Wrong passcode! Access denied." });
    socket.disconnect();
    return; // Stop running code for this connection
  }

  // 3. If passcode is correct, put this socket into a room
  const roomName = "room_1234";
  socket.join(roomName);
  console.log(`Player ${playerName} (${socket.id}) successfully joined ${roomName}`);

  // Broadcast a system message to everyone in the room (including the sender)
  io.to(roomName).emit("receive_message", {
    sender: "System",
    text: `${playerName} has entered the room.`,
    timestamp: new Date().toLocaleTimeString(),
  });

  // 4. Listen for chat messages sent from this client
  // Listen for chat messages from this client
  socket.on("send_message", (data: { text: string }) => {
    // 1. Transform text to UPPERCASE on the backend
    const uppercaseText = data.text.toUpperCase();

    console.log(`[Chat] ${playerName}: "${data.text}" -> "${uppercaseText}"`);

    // 2. Broadcast the uppercased message to EVERYONE in the room
    io.to(roomName).emit("receive_message", {
      sender: playerName,
      text: uppercaseText,
      timestamp: new Date().toLocaleTimeString(),
    });
  });
  
  // 5. Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    io.to(roomName).emit("receive_message", {
      sender: "System",
      text: `${playerName} has left the room.`,
      timestamp: new Date().toLocaleTimeString(),
    });
  });
});

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});