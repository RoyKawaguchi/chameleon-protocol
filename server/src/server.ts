import express from "express";
import { Server } from "socket.io";

import { GameRoom } from "./game/GameRoom";
import { SocketEvent } from "./models/types";

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
const activeRooms = new Map<string, GameRoom>();

io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  socket.on(SocketEvent.CREATE_ROOM, ({ username }) => {
    // Hardcode room code for now
    const roomId = "123ABC";

    // Create a new GameRoom object.
    // We pass the callback function to the constructor, so that GameRoom can emit events itself.
    const room = new GameRoom(roomId, (event, payload) => {
      io.to(roomId).emit(event, payload);
    });

    // Add the host player to the room
    room.addPlayer(socket.id, username);

    // Add room to registry
    activeRooms.set(roomId, room);

    // Add player to the Socket room too
    socket.join(roomId);
  });

  socket.on(SocketEvent.JOIN_ROOM, ({ username }) => {});

  // Example event delegation hook:
  // socket.on(SocketEvent.SUBMIT_CLUE, ({ roomId, content }) => {
  //   const room = activeRooms.get(roomId);
  //   const player = room?.players.get(socket.id);
  //   if (!player) {
  //     // TODO: emit error
  //     return;
  //   }
  //   room?.currentState.handleAction(
  //     room,
  //     player,
  //     SocketEvent.SUBMIT_CLUE,
  //     content
  //   );
  // });

  socket.on("disconnect", () => {
    console.log(`[Disconnection] User disconnected: ${socket.id}`);
    // Handle immediate room reset per your rule
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] Chameleon Protocol server running on port ${PORT}`);
});
