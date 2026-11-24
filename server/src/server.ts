import express from "express";
import { Server } from "socket.io";
import { ServerUtil } from "./ServerUtil";

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

const util = new ServerUtil(); // Object containing server data structures and methods

io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  socket.on(SocketEvent.CREATE_ROOM, ({ username }) => {
    // Generate unique 6-character room code
    let roomId = util.generateRoomCode();

    // Create a new GameRoom object with emit callback
    const room = new GameRoom(roomId, (target, event, payload) => {
      io.to(target).emit(event, payload);
    });

    // Add the host player to the room
    room.addPlayer(socket.id, username);

    util.registerSocket(socket.id, roomId);
    socket.join(roomId);

    // Add room to registry
    util.addNewRoom(roomId, room);

    socket.join(roomId);

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
    const room = util.getRoom(formattedCode);

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
    util.registerSocket(socket.id, room.roomId);
    socket.join(room.roomId);

    console.log(
      `[Room Joined] RoomID: ${room.roomId}, User: ${username}, Socket: ${socket.id}`
    );

    // Broadcast updated room state to ALL players in the room (updates member list for everyone)
    room.broadcastState();
  });

  socket.on(SocketEvent.START_GAME, () => {
    try {
      const [room, player] = util.getRoomAndPlayer(socket.id);

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
      const [room, player] = util.getRoomAndPlayer(socket.id);
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
      const [room, player] = util.getRoomAndPlayer(socket.id);

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

  socket.on(SocketEvent.CAST_VOTE, ({ targetId }) => {
    try {
      const [room, player] = util.getRoomAndPlayer(socket.id);
      room.currentState.handleAction(room, player, SocketEvent.CAST_VOTE, {
        targetId,
      });
    } catch (error) {
      console.error(
        `[Error] Failed to cast vote for socket ${socket.id}:`,
        error
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "CAST_VOTE action failed.",
      });
    }
  });

  socket.on(SocketEvent.RETURN_TO_LOBBY, () => {
    try {
      const [room, player] = util.getRoomAndPlayer(socket.id);
      room.currentState.handleAction(
        room,
        player,
        SocketEvent.RETURN_TO_LOBBY,
        {}
      );
    } catch (error) {
      console.error(
        `[Error] Failed to return to lobby for socket ${socket.id}:`,
        error
      );
      socket.emit(SocketEvent.ERROR_MESSAGE, {
        message: "RETURN_TO_LOBBY action failed.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Disconnection] User disconnected: ${socket.id}`);
    // Handle removal of recently disconnected client
    util.removePlayer(socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Chameleon Protocol server running on port ${PORT}`);
});

