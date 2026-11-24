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
    socket.emit(SocketEvent.UPDATE_CONFIG, config);
  };

  const toggleCategory = (categoryId: string) => {
    socket.emit(SocketEvent.TOGGLE_CATEGORY, { categoryId });
  };

  const toggleCategoryItem = (categoryId: string, itemId: string) => {
    socket.emit(SocketEvent.TOGGLE_CATEGORY_ITEM, { categoryId, itemId });
  };

  const saveCustomCategory = (categoryName: string, words: string[]) => {
    socket.emit(SocketEvent.SAVE_CUSTOM_CATEGORY, { categoryName, words });
  };

  const endDiscussion = () => {
    socket.emit(SocketEvent.END_DISCUSSION);
  };

  const returnToLobby = () => {
    setPlayerRole(null);
    setSecretWord(null);
    socket.emit(SocketEvent.RETURN_TO_LOBBY);
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
        if (updatedPayload.gamePhase === GamePhase.LOBBY) {
          setPlayerRole(null);
          setSecretWord(null);
        }
        setRoomState(updatedPayload);
      },
    );

    socket.on(
      SocketEvent.ROLE_ASSIGNED,
      (data: { role: Role; secretWord: string | null }) => {
        setPlayerRole(data.role);
        setSecretWord(data.secretWord);
      },
    );

    socket.on(SocketEvent.PLAYER_DISCONNECTED, (data: { message?: string }) => {
      alert(
        data?.message ||
          "A player disconnected mid-game. Please refresh the page to start a new game.",
      );
      setRoomState(null);
      setPlayerRole(null);
      setSecretWord(null);
    });

    socket.on(SocketEvent.ERROR_MESSAGE, (err: { message: string }) => {
      alert(err.message);
    });

    return () => {
      socket.off(SocketEvent.ROOM_UPDATED);
      socket.off(SocketEvent.ROLE_ASSIGNED);
      socket.off(SocketEvent.PLAYER_DISCONNECTED);
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
          onToggleCategory={toggleCategory}
          onToggleCategoryItem={toggleCategoryItem}
          onSaveCustomCategory={saveCustomCategory}
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
      return (
        <DiscussionView
          room={roomState}
          isHost={isHost}
          onEndDiscussion={endDiscussion}
        />
      );
    case GamePhase.VOTING:
      return <VotingView room={roomState} />;
    case GamePhase.GAME_OVER:
      return (
        <GameOverView
          room={roomState}
          role={playerRole}
          socketId={socket.id || ""}
          isHost={isHost}
          onReturnToLobby={returnToLobby}
        />
      );
    default:
      return <LoginForm createRoom={createRoom} joinRoom={joinRoom} />;
  }
};

export default App;
