import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { JoinPayload, Message } from "./models/types";
import { LoginForm } from "./components/LoginForm";
import { ChatRoom } from "./components/ChatRoom";
import "./App.css";

export default function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [members, setMembers] = useState<Set<string>>(new Set());
  const [roomCode, setRoomCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const socketRef = useRef<Socket | null>(null);

  const handleJoin = ({ username, roomCode }: JoinPayload) => {
    const socket = io("http://localhost:3000", {
      auth: {
        code: roomCode,
        username: username,
      },
    });

    socketRef.current = socket;

    // Successful connection
    socketRef.current.on("connect", () => {
      setIsJoined(true);
      setCurrentUser(username);
      setRoomCode(roomCode);
      setErrorMessage("");
    });

    // If server emitted "room_error", then show the error message
    socketRef.current.on("room_error", (data: { message: string }) => {
      setErrorMessage(data.message);
      setIsJoined(false);
      setMembers((prev) => {
        const next = new Set(prev);
        next.delete(currentUser);
        return next;
      }); // Delete current user just in case
      socketRef.current.disconnect();
    });

    // If server emitted "room_update", then update member set and messages array
    socketRef.current.on(
      "room_update",
      ({ members, messages }: { members: string[]; messages: Message[] }) => {
        setMembers(new Set(members));
        setMessages(messages);
      }
    );
  };

  const handleSendMessage = (text: string) => {
    if (socketRef.current) {
      socketRef.current.emit("send_message", { text });
    }
  };

  const handleLeave = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setIsJoined(false);
    setMembers((prev) => {
      const next = new Set(prev);
      next.delete(currentUser);
      return next;
    });
    setCurrentUser("");
    setRoomCode("");
    setMessages([]);
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2>Chameleon Protocol — Room Test</h2>

      {!isJoined ? (
        <LoginForm onJoin={handleJoin} errorMessage={errorMessage} />
      ) : (
        <ChatRoom
          username={currentUser}
          members={members}
          roomCode={roomCode}
          messages={messages}
          onSendMessage={handleSendMessage}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
