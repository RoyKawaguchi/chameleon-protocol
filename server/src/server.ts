import express from "express";
import { Server } from "socket.io";

import http from "http";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Adjust for client URL in production
    methods: ["GET", "POST"],
  },
});

app.get("/", (_req, res) => {
  res.send("Chameleon Protocol server is running.");
});

// Active room registry mapping 6-character room codes to GameRoom instances
// const activeRooms = new Map<string, GameRoom>();

io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  // Example event delegation hook:
  // socket.on("join_room", ({ roomId, username }) => { ... });
  // socket.on("submit_clue", ({ roomId, username, content, ... }) => { ... });

  socket.on("disconnect", () => {
    console.log(`[Disconnection] User disconnected: ${socket.id}`);
    // Handle immediate room reset per your rule
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] Chameleon Protocol server running on port ${PORT}`);
});
