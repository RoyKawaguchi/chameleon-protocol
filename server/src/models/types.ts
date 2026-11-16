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
  categoryName: string;
  categories: string[];
}

export interface GameConfig {
  clueRounds: number;
  // + some other configs in future
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

export interface SubmitCluePayload {
  clueText: string;
}

export interface SendChatPayload {
  content: string;
}

export interface CastVotePayload {
  targetId: string;
}

// 3. Server -> Client Payload (The Room State Snapshot)
export interface RoomStatePayload {
  roomId: string;
  gamePhase: GamePhase;
  players: PlayerDto[];
  config: GameConfig;
  activeCategory: string | null;
  currentRound?: number;
  currentTurnHolderSocketId?: string | null;
  clueMessages?: Array<{
    sender: { socketId: string; username: string };
    content: string;
    roundNumber: number;
  }>;
  chatTextMessages?: Array<{
    sender: { socketId: string; username: string };
    content: string;
    timestamp: number;
  }>;
}

export interface PlayerDto {
  socketId: string;
  username: string;
  isHost: boolean;
  score: number;
  role?: string; // Only sent privately or revealed at end of game
}
