/**
 * Main container component.
 * - Connects to socket events on mount.
 * - Stores current game state broadcasted from the server.
 * - Dynamically renders the appropriate View component based on room.gamePhase.
 */

import React, { useState, useEffect } from "react";
import { socket } from "./services/socket";
import { GamePhase, SocketEvent } from "./models/types";

import LoginForm from "./components/LoginForm";
import LobbyView from "./components/LobbyView";
import CluePhaseView from "./components/CluePhaseView";
import DiscussionView from "./components/DiscussionView";
import VotingView from "./components/VotingView";
import GameOverView from "./components/GameOverView";

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GamePhase>();


  /**
   * @Author Alex
   * 
   * Function that is passed LoginForm.tsx. Recieves arguments from the room hosting form and sends a CREATE_ROOM socket event to the server.
   * 
   * @param username Username recieved as a string
   */
  const createRoom = (username : string) => 
  {
    // Emit a socket event to the server to create a room
    socket.emit(SocketEvent.CREATE_ROOM, {username});
  }

  const joinRoom = (username : string, roomCode : string) =>
  {
    socket.emit(SocketEvent.JOIN_ROOM, {username, roomCode});
  }

  useEffect(() => {

    socket.on(SocketEvent.ROOM_UPDATED, (updatedState) => 
    {
      setGameState(updatedState);
    });

    return () => 
    {
      socket.off(SocketEvent.ROOM_UPDATED);
    };
  }, []);

  if (!gameState) {
    return <LoginForm createRoom={createRoom} joinRoom={joinRoom} />;
  }

  switch (gameState) 
  {
    case GamePhase.LOBBY:
      return <LobbyView />;
    case GamePhase.CLUE_PHASE:
      return <CluePhaseView />;
    case GamePhase.DISCUSSION:
      return <DiscussionView />;
    case GamePhase.VOTING:
      return <VotingView />;
    case GamePhase.GAME_OVER:
      return <GameOverView />;
    default:
      return <LoginForm createRoom={createRoom} joinRoom={joinRoom}/>;
  }
};

export default App;
