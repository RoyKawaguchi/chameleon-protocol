/**
 * Main container component.
 * - Connects to socket events on mount.
 * - Stores current game state broadcasted from the server.
 * - Dynamically renders the appropriate View component based on room.gamePhase.
 */

import React, { useState, useEffect } from "react";
import { socket } from "./services/socket";
import { GamePhase, Role, RoomStatePayload, SocketEvent } from "./models/types";

import LoginForm from "./components/LoginForm";
import LobbyView from "./components/LobbyView";
import CluePhaseView from "./components/CluePhaseView";
import DiscussionView from "./components/DiscussionView";
import VotingView from "./components/VotingView";
import GameOverView from "./components/GameOverView";

export const App: React.FC = () => {
  const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
  const [playerRole, setPlayerRole] = useState<Role | null>(null);
  const [secretWord, setSecretWord] = useState<string | null>(null);

  const createRoom = (username: string) => {
    socket.emit(SocketEvent.CREATE_ROOM, { username });
  };

  const joinRoom = (username: string, roomCode: string) => {
    socket.emit(SocketEvent.JOIN_ROOM, { username, roomCode });
  };

  const startGame = () => {
    socket.emit(SocketEvent.START_GAME);
  };

  const updateConfig = (config: RoomStatePayload["config"]) => {
    // TODO: emit CONFIG event
    socket.emit(SocketEvent.UPDATE_CONFIG, { config });
  };

  useEffect(() => {
    socket.on(
      SocketEvent.ROOM_UPDATED,
      (updatedPayload: RoomStatePayload | undefined) => {
        if (!updatedPayload) {
          setRoomState(null);
          setPlayerRole(null);
          setSecretWord(null);
          return;
        }
        setRoomState(updatedPayload);
      }
    );

    socket.on(
      SocketEvent.ROLE_ASSIGNED,
      (data: { role: Role; secretWord: string | null }) => {
        setPlayerRole(data.role);
        setSecretWord(data.secretWord);
      }
    );

    socket.on(SocketEvent.ERROR_MESSAGE, (err: { message: string }) => {
      alert(err.message);
    });

    return () => {
      socket.off(SocketEvent.ROOM_UPDATED);
      socket.off(SocketEvent.ROLE_ASSIGNED);
      socket.off(SocketEvent.ERROR_MESSAGE);
    };
  }, []);

  if (!roomState || !roomState.gamePhase) {
    return <LoginForm createRoom={createRoom} joinRoom={joinRoom} />;
  }

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
      return (
        <CluePhaseView
          room={roomState}
          role={playerRole}
          secretWord={secretWord}
          socketId={socket.id || ""}
        />
      );
    case GamePhase.DISCUSSION:
      return <DiscussionView room={roomState} isHost={isHost} />;
    case GamePhase.VOTING:
      return <VotingView room={roomState} />;
    case GamePhase.GAME_OVER:
      return (
        <GameOverView
          room={roomState}
          isHost={isHost}
          onReturnToLobby={() => socket.emit(SocketEvent.RETURN_TO_LOBBY)}
        />
      );
    default:
      return <LoginForm createRoom={createRoom} joinRoom={joinRoom} />;
  }
};

export default App;
