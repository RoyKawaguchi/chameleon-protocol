import express from "express";
import { Server } from "socket.io";

import { GameRoom } from "./game/GameRoom";
import { Player } from "./models/Player";
import {
  SocketEvent,
  JoinRoomPayload,
  SubmitCluePayload,
} from "./models/types";

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
const socketToRoomMap = new Map<string, string>();

io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  socket.on(SocketEvent.CREATE_ROOM, ({ username }) => {
    // Hardcode room code for now
    const roomId = "123ABC";

    // Create a new GameRoom object.
    // We pass the callback function to the constructor, so that GameRoom can emit events itself.
    const room = new GameRoom(roomId, (target, event, payload) => {
      io.to(target).emit(event, payload);
    });
    socketToRoomMap.set(socket.id, roomId);

    // Add the host player to the room
    room.addPlayer(socket.id, username);

    // Add room to registry
    activeRooms.set(roomId, room);

    // Add player to the Socket room too
    socket.join(roomId);
  });

  socket.on(SocketEvent.JOIN_ROOM, ({ username, roomCode }) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      const payload: JoinRoomPayload = {
        username: username,
        roomCode: roomCode,
      };

      room.currentState.handleAction(
        room,
        player,
        SocketEvent.JOIN_ROOM,
        payload
      );
    } catch (error) {
      console.error(
        `[Error] Failed to join room for socket ${socket.id}:`,
        error
      );

      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "JOIN_ROOM action failed. Room/player not found.",
      });
    }
  });

  // Example event delegation hook:
  socket.on(SocketEvent.SUBMIT_CLUE, ({ clueText }) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      const payload: SubmitCluePayload = { clueText: clueText };

      room.currentState.handleAction(
        room,
        player,
        SocketEvent.SUBMIT_CLUE,
        payload
      );
    } catch (error) {
      console.error(
        `[Error] Failed to submit clue for socket ${socket.id}:`,
        error
      );

      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "SUBMIT_CLUE action failed. Room/player not found.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Disconnection] User disconnected: ${socket.id}`);
    // Handle immediate room reset per your rule
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[Server] Chameleon Protocol server running on port ${PORT}`);
});

function getRoomAndPlayer(socketId: string): [GameRoom, Player] {
  const roomId = socketToRoomMap.get(socketId);
  if (!roomId) {
    throw new Error(`Room ID not found for socket: ${socketId}`);
  }

  const room = activeRooms.get(roomId);
  const player = room?.players.get(socketId);

  if (!room || !player) {
    throw new Error(`Room or Player missing for socket: ${socketId}`);
  }

  return [room, player];
}
