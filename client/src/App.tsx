/**
 * Main container component.
 * - Connects to socket events on mount.
 * - Stores current game state broadcasted from the server.
 * - Dynamically renders the appropriate View component based on room.gamePhase.
 */

import React, { useState, useEffect } from "react";
import { socket } from "./services/socket";
import {
  GamePhase,
  /*PlayerDto,*/ RoomStatePayload,
  SocketEvent,
} from "./models/types";

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
  const createRoom = (username: string) => {
    // Emit a socket event to the server to create a room
    socket.emit(SocketEvent.CREATE_ROOM, { username });
  };

  const joinRoom = (username: string, roomCode: string) => {
    socket.emit(SocketEvent.JOIN_ROOM, { username, roomCode });
  };

  useEffect(() => {
    socket.on(SocketEvent.ROOM_UPDATED, (updatedState) => {
      setGameState(updatedState);
    });

    return () => {
      socket.off(SocketEvent.ROOM_UPDATED);
    };
  }, []);

  if (!gameState) {
    return <LoginForm />;
    //TEMPORARY LOBBY PREVIEW
    // return (
    //   <LobbyView
    //     room={previewRoom}
    //     isHost={false}
    //     onStartGame={() => console.log("Start game clicked")}
    //     onUpdateConfig={(config) => console.log(config)}
    //   />
    // );
  }

  switch (gameState) {
    case GamePhase.LOBBY:
      return <LobbyView />; //ik theres an error is because the LobbyViewProps properties are missing
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

//To display preview of room without actual room creation. Can delete when connection to backend is made//
const previewRoom: RoomStatePayload = {
  roomID: "ABC123",
  gamePhase: GamePhase.LOBBY,

  players: [
    {
      socketId: "player1",
      username: "Devona",
      isHost: true,
      score: 0,
    },
    {
      socketId: "player2",
      username: "Alex",
      isHost: false,
      score: 0,
    },
    {
      socketId: "player3",
      username: "Roy",
      isHost: false,
      score: 0,
    },
    {
      socketId: "player4",
      username: "Taylor",
      isHost: false,
      score: 0,
    },
  ],

  config: {
    clueRounds: 1,
  },

  activeCategory: null,
};

export default App;
