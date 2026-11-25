/**
- Shared enums used across the server and mirrored on the client
- to ensure type-safe event payloads.
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

export interface CategoryItem {
  id: string;
  word: string;
  enabled: boolean;
}

export interface CategoryPool {
  id: string;
  categoryName: string;
  enabled: boolean;
  isCustom?: boolean;
  items: CategoryItem[];
}

export interface GameConfig {
  clueRounds: number;
  discussionTimeSeconds: number;
  chameleonLastResort: boolean;
}

export enum SocketEvent {
  // Client -> Server Actions
  CREATE_ROOM = "create_room",
  JOIN_ROOM = "join_room",
  START_GAME = "start_game",
  SUBMIT_CLUE = "submit_clue",
  SEND_CHAT = "send_chat",
  END_DISCUSSION = "end_discussion",
  CAST_VOTE = "cast_vote",
  LAST_RESORT_GUESS = "last_resort_guess",
  RETURN_TO_LOBBY = "return_to_lobby",
  UPDATE_CONFIG = "update_config",
  TOGGLE_CATEGORY = "toggle_category",
  TOGGLE_CATEGORY_ITEM = "toggle_category_item",
  SAVE_CUSTOM_CATEGORY = "save_custom_category",

  // Server -> Client Broadcasts
  ROOM_UPDATED = "room_updated",
  ROLE_ASSIGNED = "role_assigned",
  ERROR_MESSAGE = "error_message",
  PLAYER_DISCONNECTED = "player_disconnected",
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

export interface LastResortGuessPayload {
  guess: string;
}

export interface ToggleCategoryPayload {
  categoryId: string;
}

export interface ToggleCategoryItemPayload {
  categoryId: string;
  itemId: string;
}

export interface SaveCustomCategoryPayload {
  categoryName: string;
  words: string[];
}

// Server -> Client Payload (The Room State Snapshot)
export interface RoomStatePayload {
  roomId: string;
  gamePhase: GamePhase;
  players: PlayerDto[];
  config: GameConfig;
  categories: CategoryPool[];
  activeCategory: string | null;
  activeCategoryWords?: string[];
  secretWord?: string | null;
  currentRound?: number;
  timerEndsAt?: number | null;
  currentTurnHolderSocketId?: string | null;
  votesSubmitted?: number;
  isRevote?: boolean;
  tiedPlayers?: Array<{ socketId: string; username: string }>;
  winningFaction?: "AGENTS" | "CHAMELEON" | null;
  awaitingLastResortGuess?: boolean;
  chameleonGuessResult?: boolean | null;
  accusedPlayer?: { socketId: string; username: string } | null;
  chameleonPlayer?: { socketId: string; username: string } | null;
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
  role?: string;
}
