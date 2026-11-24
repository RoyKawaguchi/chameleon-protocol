/**
 * - Displays winning faction, secret word, accused player, and Chameleon identity.
 * - Handles Chameleon last-resort secret word guess when active.
 * - Shows submitted clues per player and allows host to return to lobby.
 */

import React, { useEffect, useMemo, useState } from "react";
import { socket } from "../services/socket";
import { Role, RoomStatePayload, SocketEvent } from "../models/types";

interface GameOverViewProps {
  room: RoomStatePayload;
  role: Role | null;
  socketId: string;
  isHost: boolean;
  onReturnToLobby: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  room,
  role,
  socketId,
  isHost,
  onReturnToLobby,
}) => {
  const [guessInput, setGuessInput] = useState("");
  const [submittingGuess, setSubmittingGuess] = useState(false);

  const chameleonSocketId = room.chameleonPlayer?.socketId;
  const accusedSocketId = room.accusedPlayer?.socketId;

  const isLocalChameleon =
    role === Role.CHAMELEON ||
    (Boolean(chameleonSocketId) && chameleonSocketId === socketId);

  const awaitingGuess = Boolean(room.awaitingLastResortGuess);
  const clues = useMemo(() => room.clueMessages ?? [], [room.clueMessages]);

  const wasAccusedChameleon = useMemo(() => {
    if (!accusedSocketId || !chameleonSocketId) return null;
    return accusedSocketId === chameleonSocketId;
  }, [accusedSocketId, chameleonSocketId]);

  const localPlayerWon = useMemo(() => {
    if (awaitingGuess || !room.winningFaction) return null;
    if (isLocalChameleon) {
      return room.winningFaction === "CHAMELEON";
    }
    return room.winningFaction === "AGENTS";
  }, [awaitingGuess, isLocalChameleon, room.winningFaction]);

  // Reset submission state when awaitingGuess changes or after a safety timeout
  useEffect(() => {
    setSubmittingGuess(false);
  }, [awaitingGuess]);

  useEffect(() => {
    if (!submittingGuess) return;
    const timeoutId = window.setTimeout(() => {
      setSubmittingGuess(false);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [submittingGuess]);

  const handleLastResortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guessInput.trim();
    if (!trimmed || submittingGuess || !awaitingGuess) return;

    setSubmittingGuess(true);
    socket.emit(SocketEvent.LAST_RESORT_GUESS, { guess: trimmed });
    setGuessInput("");
  };

  const getSecretWordDisplay = () => {
    if (awaitingGuess && isLocalChameleon) {
      return "GUESS!";
    }
    return room.secretWord || "—";
  };

  // Include any player who has clues even if they disconnected from room.players
  const allDisplayPlayers = useMemo(() => {
    const map = new Map<
      string,
      { socketId: string; username: string; role?: Role | string }
    >();

    for (const p of room.players) {
      map.set(p.socketId, {
        socketId: p.socketId,
        username: p.username,
        role: p.role,
      });
    }

    for (const msg of clues) {
      if (!map.has(msg.sender.socketId)) {
        map.set(msg.sender.socketId, {
          socketId: msg.sender.socketId,
          username: msg.sender.username,
        });
      }
    }

    return Array.from(map.values());
  }, [room.players, clues]);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050b20] px-5 py-8 text-white"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 50% 25%, rgba(95,65,190,0.35), transparent 55%),
          radial-gradient(ellipse at 80% 70%, rgba(0, 220, 202, 0.22), transparent 50%),
          radial-gradient(ellipse at 15% 80%, rgba(80,50,160,0.2), transparent 45%)
          `,
      }}
    >
      <div className="relative z-10 mx-auto max-w-5xl space-y-6">
        {/* HEADER & OUTCOME */}
        <header className="rounded-2xl border border-cyan-300/30 bg-slate-900/75 p-6 text-center backdrop-blur-md">
          <p className="text-xs font-bold tracking-[0.25em] text-cyan-300">
            GAME OVER — FINAL RESULTS
          </p>

          {awaitingGuess ? (
            <>
              <h1 className="mt-2 text-3xl font-black text-purple-300 sm:text-5xl">
                CHAMELEON LAST RESORT...
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                {room.chameleonPlayer?.username || "The Chameleon"} was caught
                and gets one final shot to guess the secret word!
              </p>
            </>
          ) : (
            <>
              {localPlayerWon !== null && (
                <div className="mt-3">
                  <span
                    className={`inline-block rounded-full border px-4 py-1 text-xs font-black tracking-[0.22em] ${
                      localPlayerWon
                        ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-200"
                        : "border-rose-400/50 bg-rose-500/20 text-rose-200"
                    }`}
                  >
                    {localPlayerWon ? "VICTORY" : "DEFEAT"}
                  </span>
                </div>
              )}

              <h1
                className={`mt-2 text-3xl font-black sm:text-5xl ${
                  room.winningFaction === "CHAMELEON"
                    ? "text-purple-300"
                    : "text-green-300"
                }`}
              >
                {room.winningFaction === "CHAMELEON"
                  ? "CHAMELEON WINS!"
                  : "LOYAL AGENTS WIN!"}
              </h1>
            </>
          )}

          {room.chameleonGuessResult !== null &&
            room.chameleonGuessResult !== undefined && (
              <p className="mt-2 text-sm text-slate-300">
                Last-resort word guess:{" "}
                <span
                  className={`font-bold ${
                    room.chameleonGuessResult
                      ? "text-purple-200"
                      : "text-green-200"
                  }`}
                >
                  {room.chameleonGuessResult
                    ? "Correct! Chameleon stole the win."
                    : "Incorrect! Chameleon failed to guess the word."}
                </span>
              </p>
            )}
        </header>

        {/* LAST RESORT GUESS PANEL */}
        {awaitingGuess && (
          <section className="rounded-2xl border border-purple-300/40 bg-slate-900/80 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-purple-200">
              Last-Resort Secret Word Guess
            </h2>
            {isLocalChameleon ? (
              <form
                onSubmit={handleLastResortSubmit}
                className="mt-3 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Enter your guess for the secret word..."
                  disabled={submittingGuess}
                  className="flex-1 rounded-lg border border-white/20 bg-slate-950 px-4 py-2.5 text-white disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!guessInput.trim() || submittingGuess}
                  className="rounded-lg bg-purple-400 px-6 py-2.5 font-bold text-slate-950 transition hover:bg-purple-300 disabled:opacity-40"
                >
                  {submittingGuess ? "SUBMITTING..." : "SUBMIT GUESS"}
                </button>
              </form>
            ) : (
              <p className="mt-2 text-sm text-slate-300">
                The Chameleon was caught and is trying to guess the secret
                word...
              </p>
            )}
          </section>
        )}

        {/* KEY REVEALS */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-5">
            <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">
              SECRET WORD
            </p>
            <p className="mt-2 text-2xl font-black text-green-300">
              {getSecretWordDisplay()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Category: {room.activeCategory || "Unknown"}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-400/35 bg-purple-950/25 p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold tracking-[0.2em] text-purple-300">
                THE CHAMELEON
              </p>
              <span className="rounded bg-purple-500/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-purple-200">
                CHAMELEON
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-purple-200">
              {room.chameleonPlayer?.username || "Unknown"}
            </p>
            <p className="mt-1 text-xs text-purple-200/75">
              {isLocalChameleon ? "That's you!" : "Blended in with the agents"}
            </p>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              wasAccusedChameleon === true
                ? "border-emerald-400/35 bg-emerald-950/20"
                : wasAccusedChameleon === false
                  ? "border-amber-400/35 bg-amber-950/20"
                  : "border-white/15 bg-slate-900/70"
            }`}
          >
            <p className="text-xs font-bold tracking-[0.2em] text-red-300">
              VOTED OUT / ACCUSED
            </p>
            <p className="mt-2 text-2xl font-black text-red-200">
              {room.accusedPlayer?.username || "None"}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {!room.accusedPlayer
                ? "No player was accused"
                : wasAccusedChameleon === true
                  ? "Caught the Chameleon!"
                  : wasAccusedChameleon === false
                    ? "Wrong target — innocent Agent accused"
                    : "Vote outcome recorded"}
            </p>
          </div>
        </section>

        {/* CLUES BY PLAYER */}
        <section className="rounded-2xl border border-white/15 bg-slate-900/70 p-6">
          <h2 className="mb-4 text-lg font-bold tracking-[0.15em] text-cyan-200">
            CLUES BY PLAYER
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {allDisplayPlayers.map((player) => {
              const playerClues = clues
                .filter((msg) => msg.sender.socketId === player.socketId)
                .sort((a, b) => a.roundNumber - b.roundNumber);

              const isChameleon =
                player.role === Role.CHAMELEON ||
                (Boolean(chameleonSocketId) &&
                  chameleonSocketId === player.socketId);

              const wasAccused =
                Boolean(accusedSocketId) && accusedSocketId === player.socketId;

              return (
                <div
                  key={player.socketId}
                  className={`rounded-xl border p-4 ${
                    isChameleon
                      ? "border-purple-400/35 bg-purple-950/20"
                      : "border-white/10 bg-slate-950/60"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-bold text-white">
                      {player.username}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {wasAccused && (
                        <span className="rounded bg-red-500/25 px-2 py-0.5 text-xs font-bold text-red-200">
                          ACCUSED
                        </span>
                      )}
                      {isChameleon && (
                        <span className="rounded bg-purple-500/30 px-2 py-0.5 text-xs font-bold text-purple-200">
                          CHAMELEON
                        </span>
                      )}
                    </div>
                  </div>

                  {playerClues.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {playerClues.map((c, idx) => (
                        <span
                          key={`${player.socketId}-${c.roundNumber}-${idx}`}
                          className="rounded-md border border-cyan-300/20 bg-cyan-950/40 px-2.5 py-1 text-sm font-semibold text-cyan-200"
                        >
                          R{c.roundNumber}: "{c.content}"
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No clues submitted</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* RETURN TO LOBBY */}
        <div className="pt-2 text-center">
          {isHost ? (
            <button
              type="button"
              onClick={onReturnToLobby}
              className="rounded-lg bg-cyan-300 px-8 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-100"
            >
              RETURN TO LOBBY
            </button>
          ) : (
            <p className="text-sm text-slate-400">
              Waiting for the host to return to the lobby...
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default GameOverView;
