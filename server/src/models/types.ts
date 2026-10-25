/**
 * Shared enums used across the server and mirrored on the client
 * to ensure type-safe event payloads.
 */

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
  // + some other configs in future
}

// Only for prototype. Delete later.
// export interface Message {
//   sender: string;
//   text: string;
//   timestamp: string;
// }

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
