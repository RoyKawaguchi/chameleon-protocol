/**
 * Active clue submission view:
 * - Displays secret category (and target word if Loyal Agent).
 * - Highlighted indicator when it is the local player's turn to submit.
 * - Single-word input field enforcing local & server-side validation.
 */

import React, { useState } from "react";
import { socket } from "../services/socket";

export const CluePhaseView: React.FC = () => {
  return (
    <div className="p-6">
      <p>Turn indicator, word list reference, single-word input form </p>
    </div>
  );
};

export default CluePhaseView;
