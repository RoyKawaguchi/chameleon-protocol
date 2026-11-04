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
import { Socket } from "dgram";
import { Testing } from "./tests/Testing";

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

    // Send the gamephase update to the player's client
    io.to(socket.id).emit(SocketEvent.ROOM_UPDATED, GamePhase.LOBBY);
  });

  socket.on(SocketEvent.JOIN_ROOM, ({ username, roomCode }) => {

    console.log(username, roomCode);

    // Search the active rooms map for a matching room code
    const room = activeRooms.get(roomCode);
    
    // If no room exits, send an ERROR_MESSAGE socket event
    if(room == null)
    {
      io.to(socket.id).emit(SocketEvent.ERROR_MESSAGE, {message: "Failed to join room: Room not found."});
      return;
    }
    // If the room is unable to be joined, send an error message socket event
    else if(!room.canJoin())
    {
      io.to(socket.id).emit(SocketEvent.ERROR_MESSAGE, {message: "Failed to join room: Room cannot be joined."});
    }

    // If no issues then create a new player in the room and connect the emitting socket to it.
    room.addPlayer(socket.id, username);
    socketToRoomMap.set(socket.id, room.roomId);
    socket.join(room.roomId);

    // Send a socket event to the client to update their view to the lobby
    io.to(socket.id).emit(SocketEvent.ROOM_UPDATED, GamePhase.LOBBY);
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

    // Nothing needs to be done if the player was not in a room.
    if(!socketToRoomMap.get(socket.id))
    {
      return;
    }

    try
    {
      const [room, player] = getRoomAndPlayer(socket.id)
      
      // If newly disconnected player is the only player in the lobby or was the host, delete room
      if(room.players.size == 1 || player.isHost)
      {
        for(let [socketID, player] of room.players)
        {
          // return all other players to the homescreen
          io.to(socketID).emit(SocketEvent.ROOM_UPDATED, undefined);
        }
        activeRooms.delete(room.roomId); // Delete Room
      }

      // Delete the player from the room
      room.players.delete(player.socketId);
    }
    catch(error)
    {
      console.error("[Error] Failure to remove user from room", error);
    }
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

// TODO
/*
function createNewRoom() : GameRoom
{
  
}
*/
