export enum Role {
  AGENT = "AGENT",
  CHAMELEON = "CHAMELEON",
}

export enum GamePhase {
  LOBBY = "LOBBY",
  CLUE_PHASE = "CLUE_PHASE",
  DISCUSSION = "DISCUSSION",
  VOTING = "VOTING",
  GAME_OVER = "GAME_OVER",
}

export interface CategoryPool {
  categoryName: string;
  categories: string[];
}

export interface GameConfig {
  clueRounds: number;
}

export enum SocketEvent {
  // Client -> Server Actions
  CREATE_ROOM = "create_room",
  JOIN_ROOM = "join_room",
  START_GAME = "start_game",
  SUBMIT_CLUE = "submit_clue",
  SEND_CHAT = "send_chat",
  CAST_VOTE = "cast_vote",
  RETURN_TO_LOBBY = "return_to_lobby",

  // Server -> Client Broadcasts
  ROOM_UPDATED = "room_updated",
  ROLE_ASSIGNED = "role_assigned",
  ERROR_MESSAGE = "error_message",
}

export interface CreateRoomPayload {
  username: string;
}

export interface JoinRoomPayload {
  username: string;
  roomCode: string;
}

export interface PlayerDto {
  socketId: string;
  username: string;
  isHost: boolean;
  score: number;
}

export interface RoomStatePayload {
  roomId: string;
  gamePhase: GamePhase;
  players: PlayerDto[];
  config: GameConfig;
  activeCategory: string | null;
}
