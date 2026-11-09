import express from "express";
import { Server } from "socket.io";

import { GameRoom } from "./game/GameRoom";
import { Player } from "./models/Player";
import {
  SocketEvent,
  JoinRoomPayload,
  SubmitCluePayload,
  GamePhase,
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

/**
 * Generates a random 6-character alphanumeric room code.
 */
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  socket.on(SocketEvent.CREATE_ROOM, ({ username }) => {
    // Generate unique 6-character room code
    let roomId = generateRoomCode();
    while (activeRooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    // Create a new GameRoom object with emit callback
    const room = new GameRoom(roomId, (target, event, payload) => {
      io.to(target).emit(event, payload);
    });

    socketToRoomMap.set(socket.id, roomId);
    socket.join(roomId);

    // Add the host player to the room
    room.addPlayer(socket.id, username);

    // Add room to registry
    activeRooms.set(roomId, room);

    console.log(
      `[Room Created] RoomID: ${roomId}, Host: ${username}, Socket: ${socket.id}`
    );

    // Broadcast room state so the host client updates to the lobby view with member list
    room.broadcastState();
  });

  socket.on(SocketEvent.JOIN_ROOM, ({ username, roomCode }) => {
    const formattedCode = roomCode?.trim().toUpperCase();
    console.log(
      `[Join Attempt] User: ${username} attempting to join room: ${formattedCode}`
    );

    // Search the active rooms map for a matching room code
    const room = activeRooms.get(formattedCode);

    if (!room) {
      io.to(socket.id).emit(SocketEvent.ERROR_MESSAGE, {
        message: "Failed to join room: Room not found.",
      });
      return;
    } else if (!room.canJoin()) {
      io.to(socket.id).emit(SocketEvent.ERROR_MESSAGE, {
        message: "Failed to join room: Room cannot be joined.",
      });
      return;
    }

    // Add player to room and map
    room.addPlayer(socket.id, username);
    socketToRoomMap.set(socket.id, room.roomId);
    socket.join(room.roomId);

    console.log(
      `[Room Joined] RoomID: ${room.roomId}, User: ${username}, Socket: ${socket.id}`
    );

    // Broadcast updated room state to ALL players in the room (updates member list for everyone)
    room.broadcastState();
  });

  socket.on(SocketEvent.START_GAME, () => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);

      // Verify the requesting player is actually the host
      if (!player.isHost) {
        room.sendPrivate(socket.id, SocketEvent.ERROR_MESSAGE, {
          message: "Only the host can start the game.",
        });
        return;
      }

      // Delegate the start action to the current state (LobbyState)
      room.currentState.handleAction(room, player, SocketEvent.START_GAME, {});
    } catch (error) {
      console.error(
        `[Error] Failed to start game for socket ${socket.id}:`,
        error
      );

      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "START_GAME action failed. Room/player not found.",
      });
    }
  });

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

  socket.on(SocketEvent.SEND_CHAT, ({ content }) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);

      room.currentState.handleAction(room, player, SocketEvent.SEND_CHAT, {
        content,
      });
    } catch (error) {
      console.error(
        `[Error] Failed to send chat for socket ${socket.id}:`,
        error
      );

      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "SEND_CHAT action failed. Room/player not found.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Disconnection] User disconnected: ${socket.id}`);

    const roomId = socketToRoomMap.get(socket.id);
    if (!roomId) {
      return;
    }

    socketToRoomMap.delete(socket.id);

    try {
      const room = activeRooms.get(roomId);
      const player = room?.players.get(socket.id);

      if (!room || !player) {
        return;
      }

      // If the disconnecting player was the host or the only player left, close room
      if (room.players.size === 1 || player.isHost) {
        for (let [socketID] of room.players) {
          if (socketID !== socket.id) {
            io.to(socketID).emit(SocketEvent.ROOM_UPDATED, undefined);
            socketToRoomMap.delete(socketID);
          }
        }
        activeRooms.delete(room.roomId);
        console.log(
          `[Room Closed] Room ${roomId} closed because host or last player left.`
        );
      } else {
        // Non-host player left: remove player and broadcast updated roster to remaining players
        room.removePlayer(socket.id);
        room.broadcastState();
      }
    } catch (error) {
      console.error(
        "[Error] Failure to remove user from room on disconnect:",
        error
      );
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Chameleon Protocol server running on port ${PORT}`);
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
