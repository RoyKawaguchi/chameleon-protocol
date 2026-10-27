/**
 * Free-form chat discussion view:
 * - Pinned immutable clue stream at the top of the view.
 * - Real-time continuous WhatsApp-style chat feed.
 * - Local self-correcting timer calculated from server `timerEndsAt`.
 * - Host controls: "Cut Short" and "+1 Min Extension".
 */

import React, { useState, useEffect } from "react";
import { socket } from "../services/socket";

export const DiscussionView: React.FC = () => {
  return (
    <div className="flex flex-col h-screen">
      <p>Header with countdown timer & host override controls</p>
      <p>Pinned clue list</p>
      <p>Scrollable text message feed & text input box</p>
    </div>
  );
};

export default DiscussionView;
