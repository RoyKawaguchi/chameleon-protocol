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

// Create an Express app
const app = express();

// Enable CORS
app.use(cors());

// Allow server to handle JSON reqs
app.use(express.json());

// Create HTTP server using the Express app
const server = http.createServer(app);
// Set up Socket.IO for real-time communication
const io = new Server(server, {
  cors: {
    origin: "*", // Currently all sources are allowed. Replace it with frontend URL when deploying.
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
 * @returns a random 6-character alphanumeric room code.
 */
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Executed when an intial connection is detected.
 */
io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  socket.on(SocketEvent.CREATE_ROOM, ({ username }) => {
    // Generate unique 6-character room code that is not taken yet
    let roomId = generateRoomCode();
    while (activeRooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    // Create a new GameRoom object with emit callback func, so GameRoom can emit events itself
    const room = new GameRoom(roomId, (target, event, payload) => {
      io.to(target).emit(event, payload);
    });

    // Save socket ID to room ID mapping
    socketToRoomMap.set(socket.id, roomId);

    // Add socket to the Socket.IO room
    socket.join(roomId);

    // Add the host player to the GameRoom
    room.addPlayer(socket.id, username);

    // Add room to registry
    activeRooms.set(roomId, room);

    console.log(
      `[Room Created] RoomID: ${roomId}, Host: ${username}, Socket: ${socket.id}`,
    );

    // Broadcast so that the Host sees themself in member list
    room.broadcastState();
  });

  socket.on(SocketEvent.JOIN_ROOM, ({ username, roomCode }) => {
    // Format roomCode
    const formattedCode = roomCode?.trim().toUpperCase();
    console.log(
      `[Join Attempt] User: ${username} attempting to join room: ${formattedCode}`,
    );

    // Search the active rooms map for a matching room code
    const room = activeRooms.get(formattedCode);

    // Validate
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

    // Add player to GameRoom, map, and Socket.IO room
    room.addPlayer(socket.id, username);
    socketToRoomMap.set(socket.id, room.roomId);
    socket.join(room.roomId);

    console.log(
      `[Room Joined] RoomID: ${room.roomId}, User: ${username}, Socket: ${socket.id}`,
    );

    // Broadcast state to ensure member list updates for everyone
    room.broadcastState();
  });

  socket.on(SocketEvent.START_GAME, () => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);

      // Verify player is host
      if (!player.isHost) {
        room.sendPrivate(socket.id, SocketEvent.ERROR_MESSAGE, {
          message: "Only the host can start the game.",
        });
        return;
      }

      // Delegate action to current state (should be LobbyState)
      room.currentState.handleAction(room, player, SocketEvent.START_GAME, {});
    } catch (error) {
      console.error(
        `[Error] Failed to start game for socket ${socket.id}:`,
        error,
      );

      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message:
          error instanceof Error
            ? error.message
            : "START_GAME action failed. Room/player not found.",
      });
    }
  });

  socket.on(SocketEvent.UPDATE_CONFIG, (payload) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      // Delegate action to current state (should be LobbyState)
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.UPDATE_CONFIG,
        payload,
      );
    } catch (error) {
      console.error(
        `[Error] Failed to update config for socket ${socket.id}:`,
        error,
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "UPDATE_CONFIG action failed.",
      });
    }
  });

  socket.on(SocketEvent.TOGGLE_CATEGORY, (payload) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      // Delegate action to current state (should be LobbyState)
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.TOGGLE_CATEGORY,
        payload,
      );
    } catch (error) {
      console.error(
        `[Error] Failed to toggle category for socket ${socket.id}:`,
        error,
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "TOGGLE_CATEGORY action failed.",
      });
    }
  });

  socket.on(SocketEvent.TOGGLE_CATEGORY_ITEM, (payload) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      // Delegate action to current state (should be LobbyState)
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.TOGGLE_CATEGORY_ITEM,
        payload,
      );
    } catch (error) {
      console.error(
        `[Error] Failed to toggle category item for socket ${socket.id}:`,
        error,
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "TOGGLE_CATEGORY_ITEM action failed.",
      });
    }
  });

  socket.on(SocketEvent.SAVE_CUSTOM_CATEGORY, (payload) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      // Delegate action to current state (should be LobbyState)
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.SAVE_CUSTOM_CATEGORY,
        payload,
      );
    } catch (error) {
      console.error(
        `[Error] Failed to save custom category for socket ${socket.id}:`,
        error,
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "SAVE_CUSTOM_CATEGORY action failed.",
      });
    }
  });

  socket.on(SocketEvent.SUBMIT_CLUE, ({ clueText }) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      const payload: SubmitCluePayload = { clueText: clueText };

      // Delegate action to current state (should be CluePhaseState)
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.SUBMIT_CLUE,
        payload,
      );
    } catch (error) {
      console.error(
        `[Error] Failed to submit clue for socket ${socket.id}:`,
        error,
      );

      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "SUBMIT_CLUE action failed. Room/player not found.",
      });
    }
  });

  socket.on(SocketEvent.SEND_CHAT, ({ content }) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);

      // Delegate action to current state (should be DiscussionState)
      room.currentState.handleAction(room, player, SocketEvent.SEND_CHAT, {
        content,
      });
    } catch (error) {
      console.error(
        `[Error] Failed to send chat for socket ${socket.id}:`,
        error,
      );

      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "SEND_CHAT action failed. Room/player not found.",
      });
    }
  });

  socket.on(SocketEvent.END_DISCUSSION, () => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      // Delegate action to current state (should be LobbyState)
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.END_DISCUSSION,
        {},
      );
    } catch (error) {
      console.error(
        `[Error] Failed to end discussion for socket ${socket.id}:`,
        error,
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "END_DISCUSSION action failed.",
      });
    }
  });

  socket.on(SocketEvent.CAST_VOTE, ({ targetId }) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      // Delegate action to current state (should be VotingState)
      room.currentState.handleAction(room, player, SocketEvent.CAST_VOTE, {
        targetId,
      });
    } catch (error) {
      console.error(
        `[Error] Failed to cast vote for socket ${socket.id}:`,
        error,
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "CAST_VOTE action failed.",
      });
    }
  });

  socket.on(SocketEvent.LAST_RESORT_GUESS, (payload) => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      // Delegate action to current state (should be GameOverState)
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.LAST_RESORT_GUESS,
        payload,
      );
    } catch (error) {
      console.error(
        `[Error] Failed to submit last-resort guess for socket ${socket.id}:`,
        error,
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "LAST_RESORT_GUESS action failed.",
      });
    }
  });

  socket.on(SocketEvent.RETURN_TO_LOBBY, () => {
    try {
      const [room, player] = getRoomAndPlayer(socket.id);
      // Delegate action to current state (should be GameOverState)
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.RETURN_TO_LOBBY,
        {},
      );
    } catch (error) {
      console.error(
        `[Error] Failed to return to lobby for socket ${socket.id}:`,
        error,
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "RETURN_TO_LOBBY action failed.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Disconnection] User disconnected: ${socket.id}`);

    // Find room. Skip if room doesn't exist
    const roomId = socketToRoomMap.get(socket.id);
    if (!roomId) return;

    // Remove socket ID from map
    socketToRoomMap.delete(socket.id);

    try {
      const room = activeRooms.get(roomId);
      const player = room?.players.get(socket.id);

      if (!room || !player) return;

      // Check if game was in progress (i.e., not in LOBBY)
      const wasInGame = room.currentState.gamePhase !== GamePhase.LOBBY;

      // Remove player from GameRoom
      room.removePlayer(socket.id);

      // If room is empty, delete it from active registry
      if (room.players.size === 0) {
        activeRooms.delete(roomId);
        console.log(`[Room Cleaned] Room ${roomId} deleted as it is empty.`);
        return;
      }

      // If disconnected mid-game, announce disconnect and prompt remaining players to refresh/restart (i.e., clear everything)
      // TODO: implement more graceful, less aggressive handling of disconnection.
      if (wasInGame) {
        io.to(roomId).emit(SocketEvent.PLAYER_DISCONNECTED, {
          username: player.username,
          message: `${player.username} disconnected mid-game. Please refresh the page to start a new game.`,
        });
        for (const remainingSocketId of room.players.keys()) {
          socketToRoomMap.delete(remainingSocketId);
        }
        activeRooms.delete(roomId);
        console.log(
          `[Room Closed] Room ${roomId} closed due to mid-game disconnect by ${player.username}.`,
        );
        return;
      }

      // If the host disconnected in the lobby AND there is at least one player remaining,
      // then assign host to the next available player
      if (player.isHost && room.players.size > 0) {
        const nextHost = room.players.values().next().value;
        if (nextHost) {
          nextHost.isHost = true;
        }
      }

      room.broadcastState();
    } catch (error) {
      console.error(
        `[Error] Failed handling disconnect for socket ${socket.id}:`,
        error,
      );
    }
  });
});

// Get the port from environment variables, or default to 4000
const PORT = Number(process.env.PORT) || 4000;

// Start the server and listen for incoming connections on the specified port
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Chameleon Protocol server running on port ${PORT}`);
});

// Helper function to fetch room and player safely
function getRoomAndPlayer(socketId: string): [GameRoom, Player] {
  const roomId = socketToRoomMap.get(socketId);
  if (!roomId) {
    throw new Error("Socket is not mapped to any room.");
  }
  const room = activeRooms.get(roomId);
  if (!room) {
    throw new Error("Room not found in active registry.");
  }
  const player = room.players.get(socketId);
  if (!player) {
    throw new Error("Player not found in room.");
  }
  return [room, player];
}
