import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: false,
});

function App() {
  const [isConnected, setIsConnected] = useState(false);

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
    <main className="chat">
      <div className="sender">
        <h1>Sender</h1>
      </div>
      <div className="message">
        <h1>Message</h1>
      </div>
    </main>
  );
}

export default App;
