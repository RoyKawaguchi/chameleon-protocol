/**
 * Main container component.
 * - Connects to socket events on mount.
 * - Stores current game state broadcasted from the server.
 * - Dynamically renders the appropriate View component based on room.gamePhase.
 */

import React, { useState, useEffect } from "react";
import { socket } from "./services/socket";
import { GamePhase, RoomStatePayload, SocketEvent } from "./models/types";

import LoginForm from "./components/LoginForm";
import LobbyView from "./components/LobbyView";
import CluePhaseView from "./components/CluePhaseView";
import DiscussionView from "./components/DiscussionView";
import VotingView from "./components/VotingView";
import GameOverView from "./components/GameOverView";

export const App: React.FC = () => {
  const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);

  /**
   * @Author Alex
   *
   * Function that is passed LoginForm.tsx.
   * Recieves arguments from the room hosting form and
   * sends a CREATE_ROOM socket event to the server.
   *
   * @param username Username recieved as a string
   */
  const createRoom = (username: string) => {
    // Emit a socket event to the server to create a room
    socket.emit(SocketEvent.CREATE_ROOM, { username });
  };

  const joinRoom = (username: string, roomCode: string) => {
    socket.emit(SocketEvent.JOIN_ROOM, { username, roomCode });
  };

  const startGame = () => {
    socket.emit(SocketEvent.START_GAME);
  };

  const updateConfig = (config: any) => {
    // TODO: emit CONFIG event
  };

  useEffect(() => {
    socket.on(
      SocketEvent.ROOM_UPDATED,
      (updatedPayload: RoomStatePayload | undefined) => {
        if (!updatedPayload) {
          // Room closed or returned to home
          setRoomState(null);
          return;
        }
        setRoomState(updatedPayload);
      }
    );

    socket.on(SocketEvent.ERROR_MESSAGE, (err: { message: string }) => {
      alert(err.message);
    });

    return () => {
      socket.off(SocketEvent.ROOM_UPDATED);
      socket.off(SocketEvent.ERROR_MESSAGE);
    };
  }, []);

  // If no active room state, show login / landing screen
  if (!roomState || !roomState.gamePhase) {
    return <LoginForm createRoom={createRoom} joinRoom={joinRoom} />;
  }

  // Determine if local player is host
  const localPlayer = roomState.players.find((p) => p.socketId === socket.id);
  const isHost = localPlayer ? localPlayer.isHost : false;

  switch (roomState.gamePhase) {
    case GamePhase.LOBBY:
      return (
        <LobbyView
          room={roomState}
          isHost={isHost}
          onStartGame={startGame}
          onUpdateConfig={updateConfig}
        />
      );
    case GamePhase.CLUE_PHASE:
      return <CluePhaseView />;
    case GamePhase.DISCUSSION:
      return <DiscussionView />;
    case GamePhase.VOTING:
      return <VotingView />;
    case GamePhase.GAME_OVER:
      return <GameOverView />;
    default:
      return <LoginForm createRoom={createRoom} joinRoom={joinRoom} />;
  }
};

export default App;
