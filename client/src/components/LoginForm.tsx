/**
 * - Enter a display name.
 * - Create a new room as Host OR enter a 6-character room code to join an existing game.
 */

import React, { useState } from "react";
// import { socket } from "../services/socket";
type Screen = "home" | "join" | "host";

export const LoginForm: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("home");
  // const [username, setUsername] = useState("");
  // const [roomCode, setRoomCode] = useState("");

  return (
    <main className="game-background flex min-h-screen items-center justify-center px-5 py-10 text-white">
      <section className="w-full max-w-xl text-center">
        <p className="mb-8 text-sm font-bold tracking-[0.3em] text-cyan-200">
          CHAMELEON PROTOCOL
        </p>

        {screen == "home" && (
          <>
            <h1 className="game-title mb-5 text-5xl font-black leading-tight sm:text-7xl">
              Chameleon
              <br />
              Protocol
            </h1>
            
            <p className="mb-10 text-sm text-slate-300 sm:text-base">
              Trust no one. Find the chameleon.
            </p>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setScreen("join")}
                className="rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-6 py-4 font-bold 
                transition hover:bg-cyan-300/30 focus-visible:outline-2 focus-visible:outline-cyan-200"
                >
                Join a Room
              </button>

              <button
                type="button"
                onClick={() => setScreen("host")}
                className="rounded-lg border border-purple-200/40 bg-purple-300/15 px-6 py-4 font-bold 
                transition hover:bg-purple-300/30 focus-visible:outline-2 focus-visible:outline-purple-200"
                >
                Host a Room
              </button>
            </div>
          </>
       )}
      </section>
    </main>
  );
};

export default LoginForm;
