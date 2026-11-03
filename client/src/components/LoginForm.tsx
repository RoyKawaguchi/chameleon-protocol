/**
 * - Enter a display name.
 * - Create a new room as Host OR enter a 6-character room code to join an existing game.
 */

import React, { useState } from "react";
// import { socket } from "../services/socket";
type Screen = "home" | "join" | "host"; //the allowed screen values

export const LoginForm: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");

  return (
    //
    <main className="game-background flex min-h-screen items-center justify-center px-5 py-10 text-white">
      <section className="w-full max-w-xl text-center">
        <p className="mb-8 text-sm font-bold tracking-[0.3em] text-cyan-200">
          CHAMELEON PROTOCOL
        </p>

        {screen == "home" && ( //home or landing screen
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

        {screen === "join" && ( //join a room screen
          <form
            className="mx-auto max-w-md space-y-5 rounded-2xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur-md sm:p-8"
            onSubmit={(event) => {
              event.preventDefault(); // stops the browser default reload or page navigation
              alert("The join form is ready for backend integration"); // will remove with backend integration
            }}
          >
            <h2 className="text-center text-3xl font-bold">
              Join a Room !
            </h2>
          
            <label className="block space-y-2"> 
              <span className="text-sm text-slate-200">Username</span>
              <input
                required
                maxLength={20}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-lg border border-white/20 bg-slate-950/60 px-4 py-3 
                text-white placeholder:text-slate-400 focus:outline-2 focus:outline-purple-300"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-200">Room Code</span>
              <input
                required
                minLength={6}
                maxLength={6}
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-character code"
                className="w-full rounded-lg border border-white/20 bg-slate-950/60 px-4 py-3 uppercase tracking-widest 
                text-white placeholder:normal-case placeholder:tracking-normal focus:outline-2 focus:outline-green-300"
              />
            </label>

            <button
              type="submit"
              // function to backend to change to lobby state
              className="w-full rounded-lg bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-100"
            >
              Continue
            </button>

            <button
              type="button"
              onClick={() => setScreen("home")}
              className="w-full py-2 text-sm text-slate-300 hover:text-white"
            >
              Back to Home
            </button>
          </form>
        )}

        {screen === "host" && ( //host a room screen
          <form
            className="mx-auto max-w-md space-y-5 rounded-2xl border border-white/20 bg-white/10 p-6 text-left backdrop-blur-md sm:p-8"
            onSubmit={(event) => {
              event.preventDefault(); // stops the browser default reload or page navigation
              alert("The host join form is ready for backend integration"); // will remove with backend integration
            }}
          >
            <h2 className="text-center text-3xl font-bold">
              Host a Room !
            </h2>
          
            <label className="block space-y-2"> 
              <span className="text-sm text-slate-200">Username</span>
              <input
                required
                maxLength={20}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-lg border border-white/20 bg-slate-950/60 px-4 py-3 
                text-white placeholder:text-slate-400 focus:outline-2 focus:outline-purple-300"
              />
            </label>
            <button
              type="submit"
              // function to backend to change to host lobby state
              className="w-full rounded-lg bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-100"
            >
              Continue
            </button>

            <button
                type="button"
                onClick={() => setScreen("home")}
                className="w-full py-2 text-sm text-slate-300 hover:text-white"
              >
                Back to Home
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default LoginForm;
