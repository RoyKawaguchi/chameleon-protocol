/**
 * Main container component.
 * - Connects to socket events on mount.
 * - Stores current game state broadcasted from the server.
 * - Dynamically renders the appropriate View component based on room.gamePhase.
 */

import React, { useState, useEffect } from "react";
import { socket } from "./services/socket";
import { GamePhase } from "./models/types";

import LoginForm from "./components/LoginForm";
import LobbyView from "./components/LobbyView";
import CluePhaseView from "./components/CluePhaseView";
import DiscussionView from "./components/DiscussionView";
import VotingView from "./components/VotingView";
import GameOverView from "./components/GameOverView";

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    socket.on("room_updated", (updatedState) => {
      setGameState(updatedState);
    });

    return () => {
      socket.off("room_updated");
    };
  }, []);

  if (!gameState) {
    return <LoginForm />;
  }

  switch (gameState.gamePhase) {
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
      return <LoginForm />;
  }
};

export default App;
