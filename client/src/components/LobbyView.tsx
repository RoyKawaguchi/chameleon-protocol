import React from "react";
import { socket } from "../services/socket";

export const LobbyView: React.FC = () => {
  return (
    <div className="p-6">
      <p>
        List of players in the room. the rules config as well. Start game button
        for host.
      </p>
    </div>
  );
};

export default LobbyView;
