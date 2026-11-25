import express from "express";
import { Server } from "socket.io";
import { ServerUtil } from "./ServerUtil";

import { GameRoom } from "./game/GameRoom";
import { SocketEvent, SubmitCluePayload } from "./models/types";

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

// Object containing server data structures and methods
const util = new ServerUtil((target, event, payload) => {
  io.to(target).emit(event, payload);
});

/**
 * Executed when an initial connection is detected.
 */
io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  socket.on(SocketEvent.CREATE_ROOM, ({ username }) => {
    // Generate unique 6-character room code
    const roomId = util.generateRoomCode();

    // Create a new GameRoom object with emit callback func, so GameRoom can emit events itself
    const room = new GameRoom(roomId, (target, event, payload) => {
      io.to(target).emit(event, payload);
    });

    // Add the host player to the GameRoom
    room.addPlayer(socket.id, username);

    // Save socket ID to room ID mapping
    util.registerSocket(socket.id, roomId);

    // Add socket to the Socket.IO room
    socket.join(roomId);

    // Add room to registry
    util.addNewRoom(roomId, room);

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
    const room = util.getRoom(formattedCode);

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
    util.registerSocket(socket.id, room.roomId);
    socket.join(room.roomId);

    console.log(
      `[Room Joined] RoomID: ${room.roomId}, User: ${username}, Socket: ${socket.id}`,
    );

    // Broadcast state to ensure member list updates for everyone
    room.broadcastState();
  });

  socket.on(SocketEvent.START_GAME, () => {
    try {
      const [room, player] = util.getRoomAndPlayer(socket.id);

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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);

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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
    // Handle removal of recently disconnected client
    util.removePlayer(socket.id);
  });
});

// Get the port from environment variables, or default to 4000
const PORT = Number(process.env.PORT) || 4000;

// Start the server and listen for incoming connections on the specified port
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Chameleon Protocol server running on port ${PORT}`);
});
