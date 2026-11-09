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
      <header>
        <p>CHAMELEON PROTOCOL</p>
        <h1>CLUE PHASE</h1>
        <p>
          Round {room.currentRound || 1} of {room.config.clueRounds}
        </p>
      </header>

      <hr />

      <section>
        <p>Active Category</p>
        <h2>{room.activeCategory || "Unknown"}</h2>

        <hr />

        {role === Role.CHAMELEON ? (
          <div>
            <p>You are the Chameleon! 🕵️‍♂️</p>
            <p>You do not know the secret word. Blend in with a clever clue!</p>
          </div>
        ) : (
          <div>
            <p>Secret Target Word:</p>
            <p>{secretWord || "Loading..."}</p>
          </div>
        )}
      </section>

      <hr />

      <section>
        <h3>Turn Order</h3>

        <ul>
          {room.players.map((player) => {
            const isCurrentTurn =
              player.socketId === room.currentTurnHolderSocketId;

            return (
              <li key={player.socketId}>
                {player.username}
                {isCurrentTurn && " — SUBMITTING..."}
              </li>
            );
          })}
        </ul>
      </section>

      <hr />

      <section>
        <h3>Submit Your Clue</h3>

        <p>
          {isMyTurn
            ? "It's your turn! Enter a single-word clue."
            : "Waiting for the current player to submit their clue..."}
        </p>

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

            <button type="submit" disabled={!clueInput.trim() || isSubmitting}>
              SUBMIT CLUE
            </button>
          </form>
        ) : (
          <p>Input locked until your turn.</p>
        )}
      </section>

      {room.clueMessages && room.clueMessages.length > 0 && (
        <>
          <hr />

          <section>
            <h3>Clues Log (Round {room.currentRound || 1})</h3>

            <ul>
              {room.clueMessages.map((msg, idx) => (
                <li key={idx}>
                  <p>
                    {msg.sender.username} (R{msg.roundNumber})
                  </p>
                  <p>"{msg.content}"</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
};
export default CluePhaseView;
