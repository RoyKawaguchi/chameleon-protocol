export interface JoinPayload {
  username: string;
  roomCode: string;
}

export interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

export interface ChatRoomProps {
  username: string;
  roomCode: string;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onLeave: () => void;
}
