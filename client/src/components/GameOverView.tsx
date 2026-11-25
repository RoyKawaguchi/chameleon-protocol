/**
 * Results and resolution view:
 * - Winner announcement banner (Loyal Agents vs. Chameleon).
 * - Chameleon last-resort word guess interface (if applicable).
 * - Action audit log summary (roles, clues submitted per round, votes cast).
 * - Host "Return to Lobby" button to restart session.
 */

import React from "react";
import { RoomStatePayload } from "../models/types";

interface GameOverViewProps {
  room: RoomStatePayload;
  isHost: boolean;
  onReturnToLobby: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  room,
  isHost,
  onReturnToLobby,
}) => {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050b20] px-5 py-10 text-white flex items-center justify-center"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 50% 25%, rgba(0,220,202,0.2), transparent 55%),
          radial-gradient(ellipse at 80% 70%, rgba(95,65,190,0.3), transparent 50%)
        `,
      }}
    >
      <div className="relative z-10 w-full max-w-3xl text-center">
        <p className="text-sm tracking-[0.3em] text-cyan-300 font-bold">
          CHAMELEON PROTOCOL
        </p>
        <h1 className="game-title mt-3 text-5xl font-black sm:text-7xl">
          GAME OVER
        </h1>

        {/* Winner Banner */}
        <div className="my-8 rounded-2xl border border-cyan-300/40 bg-cyan-300/10 p-8 backdrop-blur-md">
          <h2 className="text-3xl font-bold text-cyan-200">
            Secret Word was:{" "}
            <span className="underline">
              {room.activeCategory || "Unknown"}
            </span>
          </h2>
          <p className="mt-4 text-slate-300">
            The match has concluded. Review final player standings below.
          </p>
        </div>

        {/* Player Roster & Roles */}
        <section className="mb-8 rounded-2xl border border-white/20 bg-white/10 p-6 text-left">
          <h3 className="mb-4 text-xl font-bold">Participant Summary</h3>
          <div className="space-y-3">
            {room.players.map((player) => (
              <div
                key={player.socketId}
                className="flex items-center justify-between rounded-lg bg-slate-950/50 p-4"
              >
                <span className="font-semibold">{player.username}</span>
                <span className="text-sm text-cyan-300">
                  {player.isHost ? "HOST" : "PLAYER"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Host Restart Button */}
        {isHost ? (
          <button
            type="button"
            onClick={onReturnToLobby}
            className="rounded-xl bg-cyan-300 px-10 py-4 font-bold text-slate-950 transition hover:bg-cyan-100"
          >
            RETURN TO LOBBY
          </button>
        ) : (
          <p className="text-sm text-slate-400">
            Waiting for the host to return the room to the lobby...
          </p>
        )}
      </div>
    </main>
  );
};

export default GameOverView;
