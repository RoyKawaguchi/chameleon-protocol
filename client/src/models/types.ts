export interface JoinPayload {
  username: string;
  roomCode: string;
}

export interface Message {
  sender: string;
  text: string;
  timestamp: string;
}
