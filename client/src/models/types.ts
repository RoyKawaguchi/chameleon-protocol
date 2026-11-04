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
  [categoryName: string]: string[];
}

export interface GameConfig {
  clueRounds: number;
  // discussionTimeSeconds: number;
  // chameleonLastResortEnabled: boolean;
  // ^^commented out for now until we add the functionality
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
  ERROR_MESSAGE = "error_message",
}

//////////////////////////////
export interface PlayerDto {
  socketId: string;
  username: string;
  isHost: Boolean;
  score: number;
}

export interface RoomStatePayload {
  roomID: string;
  gamePhase: GamePhase;
  players: PlayerDto[];
  config: GameConfig;
  activeCategory: string | null;
}