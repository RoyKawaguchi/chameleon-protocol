import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: false,
});

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log(`[Socket] Connected: ${socket.id}`);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("[Socket] Disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4 text-white">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold tracking-wide text-emerald-400">
          Chameleon Protocol
        </h1>

        <p className="mb-6 text-center text-sm text-slate-400">
          Real-Time Social Deduction Engine
        </p>

        <div className="mb-6 flex items-center justify-center rounded-lg border border-slate-700/50 bg-slate-900/50 px-4 py-2">
          <span
            className={`mr-2 h-3 w-3 rounded-full ${
              isConnected ? "animate-pulse bg-emerald-500" : "bg-rose-500"
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Server Connected" : "Connecting to Server..."}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
              Display Name
            </label>
            <input
              type="text"
              placeholder="Enter your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
              Room Code
            </label>
            <input
              type="text"
              placeholder="6-character code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 uppercase tracking-widest text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-900/20 transition-colors hover:bg-emerald-500"
            >
              Create Room
            </button>
            <button
              type="button"
              className="w-full rounded-lg bg-slate-700 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-600"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
