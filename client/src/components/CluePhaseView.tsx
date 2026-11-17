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
     /* Background */
    <main
      className="relative min-h-screen overflow-hidden bg-[#050b20] px-5 py-6 text-white"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 50% 25%, rgba(95,65,190,0.35), transparent 55%),
          radial-gradient(ellipse at 80% 70%, rgba(0, 220, 202, 0.22), transparent 50%),
          radial-gradient(ellipse at 15% 80%, rgba(80,50,160,0.2), transparent 45%),
          radial-gradient(1px 1px at 20% 30%, white, transparent),
          radial-gradient(1px 1px at 70% 20%, white, transparent),
          radial-gradient(2px 2px at 40% 70%, white, transparent),
          radial-gradient(1px 1px at 85% 85%, white, transparent),
          radial-gradient(1px 1px at 10% 90%, white, transparent)
          `,
          backgroundSize: "auto, auto, auto, 120px 120px, 160px 160px, 200px 200px, 140px 140px, 180px 180px",
      }}
    >
      {/* Header */}
      <div className="relative z-10 mx-auto max-w-6xl">
          <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="bg-gradient-to-r from-green-400 via-cyan-300 to-purple-400 bg-clip-text text-3xl 
              font-black tracking-wide text-transparent sm:text-4xl">
                CHAMELEON PROTOCOL
              </h1>
              <h1 className="mt-1 text-sm tracking-[0.2em] text-slate-400">CLUE PHASE</h1>
            </div>
            <div className="rounded-xl border border-purple-300/30 bg-slate-900/70 px-5 py-3 text-right backdrop-blur-md">
              <p className="text-xs tracking-widest text-purple-300">
                Round {room.currentRound || 1} of {room.config.clueRounds}
              </p>
            </div>  
          </header>

        {/* Game Information */}

        {/* Category */}
        <section className="mb-7 ">
          <div className="rounded-2xl border border-cyan-300/30 bg-slate-900/65 p-5 shadow-lg shadow-cyan-950/30 backdrop-blur-md">
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">Secret Category</p>
            <h2 className="mt-2 text-2xl font-bold">{room.activeCategory || "Unknown"}</h2>
            {role === Role.CHAMELEON ? (
            <div>
              <p className="mt-2 text-2xl text-purple-300">You are the Chameleon!! 🦎🕵️‍♂️</p>
              <p className="mt-2 text-sm">You do not know the secret word. Blend in with a clever clue!</p>
            </div>
          ) : (
            <div>
              <p className="mt-2 text-sm text-slate-300">Secret Target Word:</p>
              <p className="font-bold text-green-300">{secretWord || "Loading..."}</p>
            </div>
          )}
          </div>          
        </section>
        {/* Turns + Players */}
        <section>
          <div className="mb-7 rounded-2xl border border-purple-300/30 bg-slate-900/65 p-5 shadow-lg shadow-purple-950/30 backdrop-blur-md">
            <h2 className="text-xs font-bold tracking-[0.2em] text-purple-300">Turn Order</h2>

            <ul className="mt-2 text-2xl font-bold">
              {room.players.map((player) => {
                const isCurrentTurn =
                  player.socketId === room.currentTurnHolderSocketId;

                return (
                  <li key={player.socketId}>
                    {player.username}
                    {isCurrentTurn && " — SUBMITTING..."}
                    <div className="mb-2 text-5xl transition-transform hover:scale-110">
                      🦎
                    </div>
                  </li>
                  
                );
              })}
            </ul>
          </div>
        </section>
        {/* Input + Submit */}
        <section className="grid items-start gap-5 md:grid-cols-2">
          <div className="mb-7 rounded-2xl border border-cyan-300/30 bg-slate-900/75 p-5 shadow-lg shadow-cyan-950/30 backdrop-blur-md">
            <h2 className="text-lg font-bold tracking-[0.2em] text-green-500">Submit Your Clue</h2>
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

                <button 
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 py-3 font-black 
                tracking-wider text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                type="submit" 
                disabled={!clueInput.trim() || isSubmitting}>
                  SUBMIT CLUE
                </button>
              </form>
            ) : (
              <p>Input locked until your turn.</p>
            )}  
          </div>
          {/* Display Clues */}
          <div className="rounded-2xl border border-purple-300/30 bg-slate-900/75 p-5 shadow-lg shadow-purple-950/30 backdrop-blur-md">
          {room.clueMessages && room.clueMessages.length > 0 && (
            <>
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-[0.2em] text-pink-300">Clues Log (Round {room.currentRound || 1})</h2>
                </div>
                
                <ul>
                  {room.clueMessages.map((msg, idx) => (
                    <li 
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3" 
                    key={idx}>
                      <p className="text-sm text-slate-200">
                        {msg.sender.username} (R{msg.roundNumber})
                      </p>
                      <p className="font-bold text-cyan-300">
                        "{msg.content}"
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
        </section>

      </div>
    </main>
  );
};
export default CluePhaseView;
