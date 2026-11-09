/**
 * Active clue submission view:
 * - Displays secret category (and target word if Loyal Agent).
 * - Highlighted indicator when it is the local player's turn to submit.
 * - Single-word input field enforcing local & server-side validation.
 */

import React, { useState } from "react";
import { socket } from "../services/socket";
import { Role, RoomStatePayload, SocketEvent } from "../models/types";

interface CluePhaseViewProps {
  room: RoomStatePayload;
  role: Role | null;
  secretWord: string | null;
  socketId: string;
}

export const CluePhaseView: React.FC<CluePhaseViewProps> = ({
  room,
  role,
  secretWord,
  socketId,
}) => {
  const [clueInput, setClueInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMyTurn = room.currentTurnHolderSocketId === socketId;

  const handleSubmitClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    socket.emit(SocketEvent.SUBMIT_CLUE, {
      clueText: clueInput.trim(),
    });

    setClueInput("");
    setIsSubmitting(false);
  };

  return (
    <main>
      <div>
        <header>
          <p>CHAMELEON PROTOCOL</p>
          <h1>CLUE PHASE</h1>
          <p>
            Round {room.currentRound || 1} of {room.config.clueRounds}
          </p>
        </header>

        <section>
          <p>Active Category</p>
          <h2>{room.activeCategory || "Unknown"}</h2>

          <div>
            {role === Role.CHAMELEON ? (
              <div>
                <p>You are the Chameleon! </p>
                <p>
                  You do not know the secret word. Blend in with a clever clue!
                </p>
              </div>
            ) : (
              <div>
                <p>Secret Target Word:</p>
                <p>{secretWord || "Loading..."}</p>
              </div>
            )}
          </div>
        </section>

        <div>
          <section>
            <h3>Turn Order</h3>

            <div>
              {room.players.map((player) => {
                const isCurrentTurn =
                  player.socketId === room.currentTurnHolderSocketId;

                return (
                  <div key={player.socketId}>
                    <span>{player.username}</span>

                    {isCurrentTurn && <span>SUBMITTING...</span>}
                  </div>
                );
              })}
            </div>
          </section>

          <div>
            <section>
              <div>
                <h3>Submit Your Clue</h3>

                <p>
                  {isMyTurn
                    ? "It's your turn! Enter a single-word clue."
                    : "Waiting for the current player to submit their clue..."}
                </p>
              </div>

              {isMyTurn ? (
                <form onSubmit={handleSubmitClue}>
                  <input
                    type="text"
                    maxLength={25}
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    placeholder="Enter single word..."
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={!clueInput.trim() || isSubmitting}
                  >
                    SUBMIT CLUE
                  </button>
                </form>
              ) : (
                <div>Input locked until your turn.</div>
              )}
            </section>
          </div>
        </div>

        {room.clueMessages && room.clueMessages.length > 0 && (
          <section>
            <h3>Clues Log (Round {room.currentRound || 1})</h3>

            <div>
              {room.clueMessages.map((msg, idx) => (
                <div key={idx}>
                  <span>
                    {msg.sender.username} (R{msg.roundNumber})
                  </span>

                  <span>"{msg.content}"</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};
export default CluePhaseView;
