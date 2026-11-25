/**
- Free-form chat discussion view:
- - Pinned immutable clue stream at the top of the view.
- - Real-time continuous WhatsApp-style chat feed.
- - Local self-correcting timer calculated from server `timerEndsAt`.
- - Host controls: "Cut Short" and "+1 Min Extension".
 */

import React, { useState, useEffect } from "react";
import { socket } from "../services/socket";
import { Role, RoomStatePayload } from "../models/types";

interface DiscussionViewProps {
  room: RoomStatePayload;
  role: Role | null;
  secretWord: string | null;
  isHost: Boolean;
  onEndDiscussion: () => void;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

const formatMessageTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const DiscussionView: React.FC<DiscussionViewProps> = ({
  room,
  role,
  secretWord,
  isHost,
  onEndDiscussion,
}) => {
  const [message, setMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(() =>
    room.timerEndsAt
      ? Math.max(0, Math.ceil((room.timerEndsAt - Date.now()) / 1000))
      : room.config.discussionTimeSeconds,
  );

  const chatMessages = room.chatTextMessages ?? [];
  const currentSocketId = socket.id;

  // Countdown timer synchronized with the server timestamp
  useEffect(() => {
    if (!room.timerEndsAt) return;

    const updateTimer = () => {
      setSecondsLeft(
        Math.max(0, Math.ceil((room.timerEndsAt! - Date.now()) / 1000)),
      );
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 250);

    return () => window.clearInterval(interval);
  }, [room.timerEndsAt]);

  // Send a message to the server
  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    socket.emit(SocketEvent.SEND_CHAT, {
      content: trimmedMessage,
    });

    setMessage("");
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050b20] px-5 py-6 text-white"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 50% 25%, rgba(95,65,190,0.35), transparent 55%),
          radial-gradient(ellipse at 80% 70%, rgba(0, 220, 202, 0.26), transparent 50%),
          radial-gradient(ellipse at 15% 80%, rgba(126, 96, 210, 0.2), transparent 45%),
          radial-gradient(1px 1px at 20% 30%, white, transparent),
          radial-gradient(1px 1px at 70% 20%, white, transparent),
          radial-gradient(2px 2px at 40% 70%, white, transparent),
          radial-gradient(1px 1px at 85% 85%, white, transparent),
          radial-gradient(1px 1px at 10% 90%, white, transparent)
          `,
        backgroundSize:
          "auto, auto, auto, 120px 120px, 160px 160px, 200px 200px, 140px 140px, 180px 180px",
      }}
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        {/*Header + Timer*/}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              className="bg-gradient-to-r from-green-400 via-cyan-300 to-purple-400 bg-clip-text text-3xl 
            font-black tracking-wide text-transparent sm:text-4xl"
            >
              CHAMELEON PROTOCOL
            </h1>
            <h1 className="mb-10 mt-1 text-sm tracking-[0.2em] text-slate-400">
              DISCUSSION PHASE
            </h1>
          </div>
          <div
            className={`rounded-xl border px-6 py-3 text-center backdrop-blur-md ${
              secondsLeft <= 15
                ? "border-red-400/60 bg-red-950/50"
                : "border-cyan-300/30 bg-slate-900/70"
            }`}
          >
            <p className="">Time Remaining</p>

            <p
              className={`text-3xl font-black tabular-nums ${
                secondsLeft <= 15 ? "text-red-300" : "text-cyan-300"
              }`}
            >
              {formatTime(secondsLeft)}
            </p>

            {isHost && (
              <>
                <p className="">Host: discussion timer</p>
                <button type="button" onClick={onEndDiscussion}>
                  Cut Discussion Short
                </button>
              </>
            )}
          </div>
        </header>

        {/*Discussion Title */}
        <section>
          <h1 className="game-title text-center text-5xl font-black leading-tight sm:text-9xl">
            DISCUSS
          </h1>

          <p className="mb-10 text-sm text-center text-slate-300 sm:text-xl">
            Cast your suspicions, find the Chameleon.
          </p>
        </section>

        {/* Role & Secret Word */}
        <section className="mb-6 rounded-2xl border border-cyan-300/30 bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-300">
                YOUR ROLE &amp; CATEGORY ({room.activeCategory || "Unknown"})
              </p>
              {role === Role.CHAMELEON ? (
                <p className="mt-1 text-lg font-bold text-purple-300">
                  Chameleon — Secret word is hidden. Blend in!
                </p>
              ) : role === Role.AGENT ? (
                <p className="mt-1 text-lg font-bold text-green-300">
                  Loyal Agent — Secret Word: {secretWord || "Loading..."}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-400">Role unassigned</p>
              )}
            </div>
          </div>
        </section>

        {/*Pinned clue from the rounds*/}
        <section
          className="rounded-2xl border border-purple-300/30 bg-slate-1000/50 
          p-5 shadow-lg shadow-purple-950/30 backdrop-blur-md"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold tracking-[0.18em] text-purple-300">
              PINNED CLUES
            </h2>

            <span className="text-xs text-slate-400">All clue rounds</span>
          </div>

          <p className="mb-4 text-center text-base font-bold tracking-[0.1em] text-cyan-300">
            Take a look at the previous rounds clues everyone shared. You may
            find something interesting to discuss (hehehehe)
          </p>

          {room.clueMessages && room.clueMessages.length > 0 && (
            <>
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-[0.2em] text-green-600">
                    Clues Log
                  </h2>
                </div>

                <ul>
                  {room.clueMessages.map((msg, idx) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3"
                      key={idx}
                    >
                      <p className="text-sm text-slate-200">
                        {msg.sender.username} (R{msg.roundNumber})
                      </p>
                      <p className="font-bold text-cyan-300">"{msg.content}"</p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </section>

        {/*Discussion Chat*/}
        <section
          className="mt-4 overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-900/70 
        shadow-xl shadow-cyan-950/20 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-black tracking-[0.15em] text-cyan-300">
              CHAT
            </h2>
            <p className="text-xs text-slate-400">
              Discuss your suspicions with the other players.
            </p>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
              {chatMessages.length} messages
            </span>
          </div>
          {/*Show chat on screen*/}
          <div className="flex h-[400px] flex-col gap-4 overflow-y-auto p-5">
            {chatMessages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <p className="mb-2 text-lg font-bold text-slate-300">
                    No messages yet
                  </p>

                  <p className="text-sm text-slate-500">
                    Start the discussion!
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMine = msg.sender.socketId === currentSocketId;

                return (
                  <div
                    key={`${msg.timestamp}-${msg.sender.socketId}-${idx}`}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                        isMine
                          ? "rounded-br-sm border border-cyan-300/30 bg-cyan-500/20"
                          : "rounded-bl-sm border border-purple-300/20 bg-slate-800"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <p
                          className={`text-xs font-bold ${
                            isMine ? "text-cyan-300" : "text-purple-300"
                          }`}
                        >
                          {isMine ? "You" : msg.sender.username}
                        </p>

                        <p className="text-[10px] text-slate-500">
                          {formatMessageTime(msg.timestamp)}
                        </p>
                      </div>

                      <p className="whitespace-pre-wrap break-words text-sm text-slate-100">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/*Type in chattttt*/}
          <form
            onSubmit={handleSendMessage}
            className="flex gap-3 border-t border-white/10 bg-slate-950/50 p-4"
          >
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your message..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-1 focus:ring-cyan-300/30"
            />

            <button
              type="submit"
              disabled={!message.trim()}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default DiscussionView;
