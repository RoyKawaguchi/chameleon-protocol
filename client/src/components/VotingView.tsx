/**
 * components/VotingView.tsx
 *
 * Accusation phase view:
 * - Interactive grid of player profile cards to cast secret vote.
 * - Lock-in indicator upon selection.
 * - Tie-breaker modal panel for host if votes result in a tie.
 */

import React, { useState } from "react";
import { socket } from "../services/socket";
import { RoomStatePayload, SocketEvent } from "../models/types";

interface VotingViewProps {
  room: RoomStatePayload;
}

export const VotingView: React.FC<VotingViewProps> = ({room}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const currentSocketId = socket.id || "";
  const players = room.players;
  const votesSubmitted = room.votesSubmitted ?? 0;
  const totalPlayers = players.length;

  const selectedPlayer = players.find(
    (player) => player.socketId === selectedPlayerId
  );

  const handleSubmitVote = () => {
    if (!selectedPlayerId) return;

    socket.emit(SocketEvent.CAST_VOTE, {
      targetId: selectedPlayerId,
    });
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050b20] px-5 py-6 text-white"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 50% 25%, rgba(95,65,190,0.35), transparent 55%),
          radial-gradient(ellipse at 80% 70%, rgba(220, 0, 0, 0.26), transparent 50%),
          radial-gradient(ellipse at 15% 80%, rgba(126, 96, 210, 0.2), transparent 45%),
          radial-gradient(1px 1px at 20% 30%, white, transparent),
          radial-gradient(1px 1px at 70% 20%, white, transparent),
          radial-gradient(2px 2px at 40% 70%, white, transparent),
          radial-gradient(1px 1px at 85% 85%, white, transparent),
          radial-gradient(1px 1px at 10% 90%, white, transparent)
          `,
          backgroundSize: "auto, auto, auto, 120px 120px, 160px 160px, 200px 200px, 140px 140px, 180px 180px",
      }}
    >

      <div className="relative z-10 mx-auto max-w-6xl">
        {/*Header*/}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-red-700 via-blue-300 to-purple-800 bg-clip-text text-3xl 
            font-black tracking-wide text-transparent sm:text-4xl">
              CHAMELEON PROTOCOL
            </h1>
            <h1 className="mb-10 mt-1 text-sm tracking-[0.2em] text-slate-400">VOTING PHASE</h1>
          </div>
        </header>

        <section className="mb-8 text-center">
          <h2 className="bg-gradient-to-r from-red-900 via-purple-500 to-red-900 text-4xl font-black sm:text-6xl">
            Who is the Chameleon?
          </h2>

          <p className="mt-3 text-slate-300 text-xl">
            Select the player you suspect.
          </p>
        </section>

        {/*Voting Process*/}
        <section className="mb-8 rounded-xl border border-cyan-300/20 bg-slate-900/70 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              VOTING PROGRESS
            </span>

            <span className="font-bold text-purple-300">
              {votesSubmitted}/{totalPlayers}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-purple-400 transition-all duration-500"
              style={{
                width: `${
                  totalPlayers > 0
                    ? (votesSubmitted / totalPlayers) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Votes are private. You can change your selection until voting ends.
          </p>
        </section>

        {/* Player selection grid*/}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

          {players.map((player) => {
            const isSelected =
              selectedPlayerId === player.socketId;

            const isCurrentPlayer =
              player.socketId === currentSocketId;

            return (
              <button
                key={player.socketId}
                type="button"
                onClick={() =>
                  setSelectedPlayerId(player.socketId)
                }
                className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all duration-200 ${
                  isSelected
                    ? "scale-[1.02] border-red-300 bg-red-950/60 shadow-lg shadow-cyan-500/20"
                    : "border-white/15 bg-slate-900/70 hover:border-purple-300/60 hover:bg-slate-800/90"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl font-black ${
                    isSelected
                      ? "border-cyan-300 bg-cyan-300/20 text-cyan-200"
                      : "border-slate-500 bg-slate-800 text-slate-300"
                  }`}
                >
                  {player.username.charAt(0).toUpperCase()}
                </div>

                <div className="text-center">
                  <p className="font-bold">
                    {player.username}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {isCurrentPlayer
                      ? "YOU"
                      : isSelected
                      ? "SELECTED"
                      : "SELECT PLAYER"}
                  </p>
                </div>

                {isSelected && (
                  <span className="text-xs font-bold tracking-widest text-cyan-300">
                    YOUR SUSPECT
                  </span>
                )}
              </button>
            );
          })}

        </section>

        {/* confirm selection */}
        <section className="mt-8 rounded-2xl border border-purple-300/20 bg-slate-900/70 p-6 text-center">

          <p className="text-sm font-semibold tracking-widest text-slate-400">
            YOUR SELECTION
          </p>

          {selectedPlayer ? (
            <h3 className="mt-3 text-3xl font-black text-cyan-300">
              {selectedPlayer.username}
            </h3>
          ) : (
            <p className="mt-3 text-lg text-slate-500">
              No player selected
            </p>
          )}

          <button
            type="button"
            disabled={!selectedPlayerId}
            onClick={handleSubmitVote}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-400 to-red-500 px-8 py-4 font-black tracking-widest text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            SUBMIT / UPDATE VOTE
          </button>

          <p className="mt-3 text-xs text-slate-400">
            You can update your vote until everyone has voted.
          </p>

        </section>
        

      </div>
    </main>

  );
};

export default VotingView;
