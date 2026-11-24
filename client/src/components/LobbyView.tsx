import React, { useState, useEffect } from "react";
import { GameConfig, RoomStatePayload } from "../models/types";

interface LobbyViewProps {
  room: RoomStatePayload;
  isHost: boolean;
  onStartGame: () => void;
  onUpdateConfig: (config: GameConfig) => void;
  onToggleCategory: (categoryId: string) => void;
  onToggleCategoryItem: (categoryId: string, itemId: string) => void;
  onSaveCustomCategory: (categoryName: string, words: string[]) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  isHost,
  onStartGame,
  onUpdateConfig,
  onToggleCategory,
  onToggleCategoryItem,
  onSaveCustomCategory,
}) => {
  const [clueRounds, setClueRounds] = useState(room.config.clueRounds);
  const [discusisonTime, setDiscussionTime] = useState(
    room.config.discussionTimeSeconds,
  );
  const [chameleonLastResort, setChameleonLastResort] = useState(
    room.config.chameleonLastResort,
  );

  const existingCustomCategory = (room.categories || []).find(
    (cat) => cat.isCustom,
  );
  const [isEditingCustom, setIsEditingCustom] = useState(
    !existingCustomCategory,
  );
  const [customName, setCustomName] = useState(
    existingCustomCategory?.categoryName || "",
  );
  const [customWordsInput, setCustomWordsInput] = useState(
    existingCustomCategory?.items.map((item) => item.word).join(", ") || "",
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

  useEffect(() => {
    if (existingCustomCategory && !isEditingCustom) {
      setCustomName(existingCustomCategory.categoryName);
      setCustomWordsInput(
        existingCustomCategory.items.map((item) => item.word).join(", "),
      );
    }
  }, [existingCustomCategory, isEditingCustom]);

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

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWords = customWordsInput
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    onSaveCustomCategory(customName, parsedWords);
    setIsEditingCustom(false);
  };

  const hasEligibleWords = (room.categories || []).some(
    (cat) => cat.enabled && cat.items.some((item) => item.enabled),
  );

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
          <div className="space-y-6">
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

            {/* CATEGORIES & ITEMS + SINGLE CUSTOM CATEGORY */}
            <section className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-2xl font-bold">Categories & Words</h2>
                {!hasEligibleWords && (
                  <span className="text-sm text-red-300">
                    Enable at least 1 category with at least 1 word to start.
                  </span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(room.categories || []).map((category) => (
                  <div
                    key={category.id}
                    className={`rounded-xl border p-4 transition ${
                      category.enabled
                        ? "border-cyan-300/30 bg-slate-950/50"
                        : "border-white/10 bg-slate-950/25 opacity-60"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <label className="flex cursor-pointer items-center gap-2.5 font-bold">
                        <input
                          type="checkbox"
                          checked={category.enabled}
                          onChange={() => onToggleCategory(category.id)}
                          className="h-4 w-4 accent-cyan-300"
                        />
                        <span>{category.categoryName}</span>
                        {category.isCustom && (
                          <span className="rounded bg-purple-500/30 px-2 py-0.5 text-xs text-purple-200">
                            CUSTOM
                          </span>
                        )}
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {category.items.map((item) => (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm transition ${
                            category.enabled && item.enabled
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-white/10 bg-slate-900/40 text-slate-400 line-through"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!category.enabled}
                            checked={item.enabled}
                            onChange={() =>
                              onToggleCategoryItem(category.id, item.id)
                            }
                            className="h-3.5 w-3.5 accent-cyan-300"
                          />
                          <span>{item.word}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* CUSTOM CATEGORY (MAX 1) */}
              <div className="mt-6 rounded-xl border border-purple-300/30 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-purple-200">
                    Custom Category (1 Max)
                  </h3>
                  {existingCustomCategory && !isEditingCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomName(existingCustomCategory.categoryName);
                        setCustomWordsInput(
                          existingCustomCategory.items
                            .map((item) => item.word)
                            .join(", "),
                        );
                        setIsEditingCustom(true);
                      }}
                      className="rounded-lg border border-purple-300/40 bg-purple-400/15 px-3 py-1 text-xs font-semibold text-purple-200 hover:bg-purple-400/25"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingCustom || !existingCustomCategory ? (
                  <form onSubmit={handleSaveCustom} className="space-y-3">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Category name (e.g., Movies)"
                      className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="text"
                      value={customWordsInput}
                      onChange={(e) => setCustomWordsInput(e.target.value)}
                      placeholder="Comma-separated words (at least 1 word, e.g., Inception, Titanic)"
                      className="w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-purple-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-purple-300"
                      >
                        Save Custom Category
                      </button>
                      {existingCustomCategory && (
                        <button
                          type="button"
                          onClick={() => setIsEditingCustom(false)}
                          className="rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-slate-300">
                    Active Custom Category:{" "}
                    <span className="font-semibold text-white">
                      {existingCustomCategory.categoryName}
                    </span>{" "}
                    ({existingCustomCategory.items.length} word
                    {existingCustomCategory.items.length === 1 ? "" : "s"})
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {/* PLAYER LOBBY */}
        {!isHost && (
          <div className="mx-auto max-w-2xl">
            <h2 className="game-title text-center text-6xl font-bold">
              Waiting for Host...
            </h2>

            <p className="mt-3 text-center text-slate-300">
              The host will start the game when everyone is ready.
            </p>

            {/* PLAYER LIST */}
            <section className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-6">
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
                : !hasEligibleWords
                  ? "Enable at least one category with words to start."
                  : "Your room is ready!"}
            </p>

            <button
              type="button"
              disabled={room.players.length < 4 || !hasEligibleWords}
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
