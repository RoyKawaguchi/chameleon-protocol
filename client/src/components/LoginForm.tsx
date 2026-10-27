/**
 * - Enter a display name.
 * - Create a new room as Host OR enter a 6-character room code to join an existing game.
 */

import React, { useState } from "react";
import { socket } from "../services/socket";

export const LoginForm: React.FC = () => {
  // const [username, setUsername] = useState("");
  // const [roomCode, setRoomCode] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>
        A form with Name input, optional code input, and create/join buttons
      </p>
    </div>
  );
};

export default LoginForm;
