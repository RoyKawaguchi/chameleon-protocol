import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://localhost:4000";

// Switch to this for live demo using different devices
// const SERVER_URL = "http://10.152.132.40:4000";

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ["websocket"],
});
