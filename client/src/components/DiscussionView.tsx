/**
 * Free-form chat discussion view:
 * - Pinned immutable clue stream at the top of the view.
 * - Real-time continuous WhatsApp-style chat feed.
 * - Local self-correcting timer calculated from server `timerEndsAt`.
 * - Host controls: "Cut Short" and "+1 Min Extension".
 */

import React, { useState, useEffect } from "react";
//import { socket } from "../services/socket";
import { RoomStatePayload } from "../models/types";

interface DiscussionViewProps {
  room: RoomStatePayload;
  isHost: Boolean;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export const DiscussionView: React.FC<DiscussionViewProps> = ({
  room,
  isHost,
}) => {
  //const [message, setMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(() =>
    room.timerEndsAt
      ? Math.max(0, Math.ceil((room.timerEndsAt - Date.now()) / 1000))
      : room.config.discussionTimeSeconds
  );

  const chatMessages = room.chatTextMessages ?? [];
  //const clueMessages = room.clueMessages ?? [];

  // Countdown timer synchronized with the server timestamp
  useEffect(() => {
    if (!room.timerEndsAt) return;

    const updateTimer = () => {
      setSecondsLeft(
        Math.max(
          0,
          Math.ceil((room.timerEndsAt! - Date.now()) / 1000)
        )
      );
    };

    updateTimer();

    const interval = window.setInterval(updateTimer, 250);

    return () => window.clearInterval(interval);
  }, [room.timerEndsAt]);


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
          backgroundSize: "auto, auto, auto, 120px 120px, 160px 160px, 200px 200px, 140px 140px, 180px 180px",
      }}
    >
      {/* <div className="flex flex-col h-screen">
        <p>Header with countdown timer & host override controls</p>
        <p>Pinned clue list</p>
        <p>Scrollable text message feed & text input box</p>
      </div> */}

      <div className="relative z-10 mx-auto max-w-6xl">
        {/*Header + Timer? -> might move the timer idk*/}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-green-400 via-cyan-300 to-purple-400 bg-clip-text text-3xl 
            font-black tracking-wide text-transparent sm:text-4xl">
              CHAMELEON PROTOCOL
            </h1>
            <h1 className="mb-10 mt-1 text-sm tracking-[0.2em] text-slate-400">DISCUSSION PHASE</h1>
          </div>
          <div
            className={`rounded-xl border px-6 py-3 text-center backdrop-blur-md ${
                secondsLeft <= 15
                  ? "border-red-400/60 bg-red-950/50"
                  : "border-cyan-300/30 bg-slate-900/70"
            }`}
          >
            <p className="">
              Time Remaining
            </p>

            <p
              className={`text-3xl font-black tabular-nums ${
                secondsLeft <= 15
                  ? "text-red-300"
                  : "text-cyan-300"
              }`}
            
            >
              {formatTime(secondsLeft)}
            </p>

            {isHost && (
              <p className="">
                Host: discussion timer
              </p>
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

        {/*Pinned clue from the rounds*/}
        <section className="rounded-2xl border border-purple-300/30 bg-slate-1000/50 
          p-5 shadow-lg shadow-purple-950/30 backdrop-blur-md">
          
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold tracking-[0.18em] text-purple-300">
              PINNED CLUES
            </h2>

            <span className="text-xs text-slate-400">
              All clue rounds
            </span>
          </div>
          
          <p className="mb-4 text-center text-base font-bold tracking-[0.1em] text-cyan-300">
            Take a look at the previous rounds clues everyone shared. You may find something interesting to discuss (hehehehe)
          </p>

          
          {room.clueMessages && room.clueMessages.length > 0 && (
            <>
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-bold tracking-[0.2em] text-green-600">Clues Log (Round {room.currentRound || 1})</h2>
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
        </section>

        {/*TODO: Discussion Chat*/}
        <section
          className=""
        >
          <div className="">
            <h2 className="">CHAT</h2>
            <span className="">
              {chatMessages.length} messages
            </span>
          </div>
          {/*TODO: Show chat */}
          <div className="">

          </div>


          {/*TODO: Type in chattttt*/}
          <div className="">

          </div>


        </section>

      </div>

    </main>
  );
};

export default DiscussionView;
