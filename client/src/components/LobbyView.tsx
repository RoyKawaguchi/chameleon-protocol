import React, { useState, useEffect } from "react";
import { GameConfig, RoomStatePayload } from "../models/types";

interface LobbyViewProps {
  room: RoomStatePayload;
  isHost: boolean;
  onStartGame: () => void;
  onUpdateConfig: (config: GameConfig) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  isHost,
  onStartGame,
  onUpdateConfig,
}) => {
  const [clueRounds, setClueRounds] = useState(room.config.clueRounds);
  const [discusisonTime, setDiscussionTime] = useState(
    room.config.discussionTimeSeconds,
  );
  const [chameleonLastResort, setChameleonLastResort] = useState(
    room.config.chameleonLastResort,
  );

  useEffect(() => {
    setClueRounds(room.config.clueRounds);
    setDiscussionTime(room.config.discussionTimeSeconds);
    setChameleonLastResort(room.config.chameleonLastResort);
  }, [
    room.config.clueRounds,
    room.config.discussionTimeSeconds,
    room.config.chameleonLastResort,
  ]);

  const handleRoundChange = (rounds: number) => {
    setClueRounds(rounds);

    onUpdateConfig({
      ...room.config,
      clueRounds: rounds,
      discussionTimeSeconds: discusisonTime,
      chameleonLastResort,
    });
  };

  const handleDiscussionTimeChange = (seconds: number) => {
    setDiscussionTime(seconds);

    onUpdateConfig({
      ...room.config,
      clueRounds,
      discussionTimeSeconds: seconds,
      chameleonLastResort,
    });
  };

  const handleLastResortChange = (enabled: boolean) => {
    setChameleonLastResort(enabled);

    onUpdateConfig({
      ...room.config,
      clueRounds,
      discussionTimeSeconds: discusisonTime,
      chameleonLastResort: enabled,
    });
  };

  return (
    <main className="game-background min-h-screen px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <header className="mb-8 text-center">
          <p className="text-sm tracking-[0.3em] text-cyan-200">
            CHAMELEON PROTOCOL
          </p>

          <h1 className="game-title mt-3 text-5xl font-black">GAME LOBBY</h1>

          <p className="mt-3 text-2xl text-slate-300">
            Room Code: {room.roomId}
          </p>
        </header>

        {/* HOST LOBBY */}
        {isHost && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* PLAYER LIST */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <h2 className="mb-4 text-2xl font-bold">Players</h2>

              <div className="space-y-3">
                {room.players.map((player) => (
                  <div
                    key={player.socketId}
                    className="flex items-center justify-between rounded-lg bg-slate-950/50 p-4"
                  >
                    <span>{player.username}</span>

                    {player.isHost && (
                      <span className="text-sm text-green-300">HOST</span>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm text-slate-400">
                {room.players.length}/8 Players
              </p>
            </section>

            {/* GAME CONFIG */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <h2 className="mb-5 text-2xl font-bold">Game Settings</h2>

              {/* CLUE ROUNDS */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Clue Rounds</h3>

                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((round) => (
                    <button
                      key={round}
                      type="button"
                      onClick={() => handleRoundChange(round)}
                      className={`rounded-lg border p-3 font-bold transition ${
                        clueRounds === round
                          ? "border-cyan-300 bg-cyan-300/20 text-cyan-200"
                          : "border-white/20 bg-slate-950/40 hover:bg-white/10"
                      }`}
                    >
                      {round} Round{round > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* ROUND TIMER */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Discussion Timer</h3>

                <div className="grid grid-cols-2 gap-3">
                  {[60, 90, 120].map((seconds) => (
                    <button
                      key={seconds}
                      type="button"
                      onClick={() => handleDiscussionTimeChange(seconds)}
                      className={`rounded-lg border p-3 font-bold transition${
                        discusisonTime === seconds
                          ? "border-cyan-300 bg-cyan-300/20 text-cyan-200"
                          : "border-white/20 bg-slate-950/40 hover:bg-white/10"
                      }`}
                    >
                      {seconds / 60} min
                    </button>
                  ))}
                </div>
              </div>

              {/* CHAMELEON CHANCE */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Chameleon Last Chance</h3>

                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((enabled) => (
                    <button
                      key={String(enabled)}
                      type="button"
                      onClick={() => handleLastResortChange(enabled)}
                      className={`rounded-lg border p-3 font-bold transition ${
                        chameleonLastResort === enabled
                          ? "border-cyan-300 bg-cyan-300/20 text-cyan-200"
                          : "border-white/20 bg-slate-950/40 hover:bg-white/10"
                      }`}
                    >
                      {enabled ? "On" : "Off"}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-slate-400">
                More game settings coming soon.
              </p>
            </section>
          </div>
        )}

        {/* PLAYER LOBBY */}
        {!isHost && (
          <div className="mx-auto max-w-2xl">
            <h2 className="game-title text-6xl font-bold text-center">
              Waiting for Host...
            </h2>

            <p className="mt-3 text-center text-slate-300">
              The host will start the game when everyone is ready.
            </p>

            {/* PLAYER LIST */}
            <section className="rounded-2xl mt-8 border border-white/20 bg-white/10 p-6">
              <h2 className="mb-4 text-2xl font-bold">Players in Room</h2>

              <div className="space-y-3">
                {room.players.map((player) => (
                  <div
                    key={player.socketId}
                    className="flex items-center justify-between rounded-lg bg-slate-950/50 p-4"
                  >
                    <span>{player.username}</span>

                    {player.isHost && (
                      <span className="text-sm text-cyan-300">HOST</span>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm text-slate-400">
                {room.players.length}/8 Players
              </p>
            </section>
          </div>
        )}

        {/* HOST START BUTTON */}
        {isHost && (
          <div className="mt-8 text-center">
            <p className="mb-4 text-sm text-slate-300">
              {room.players.length < 4
                ? `Waiting for ${4 - room.players.length} more player(s)...`
                : "Your room is ready!"}
            </p>

            <button
              type="button"
              disabled={room.players.length < 4}
              onClick={onStartGame}
              className="rounded-lg bg-cyan-300 px-10 py-4 font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              START GAME
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default LobbyView;
