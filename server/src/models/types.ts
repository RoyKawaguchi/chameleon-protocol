/**
 * Shared enums used across the server and mirrored on the client
 * to ensure type-safe event payloads.
 */

/**
 * Enum representing the role of a player. AGENT or CHAMELEON.
 */
export enum Role {
  AGENT = "AGENT",
  CHAMELEON = "CHAMELEON",
}

/**
 * Enum representing the 5 game phases:
 * LOBBY, CLUE_PHASE, DISCUSSION, VOTING, GAME_OVER.
 */
export enum GamePhase {
  LOBBY = "LOBBY",
  CLUE_PHASE = "CLUE_PHASE",
  DISCUSSION = "DISCUSSION",
  VOTING = "VOTING",
  GAME_OVER = "GAME_OVER",
}

/**
 * Interface representing a single item in a category (e.g., "Lion")
 * Used when toggling it on or off.
 */
export interface CategoryItem {
  id: string;
  word: string;
  enabled: boolean;
}

/**
 * Interface representing the pool of items in a single category (e.g., "Animals").
 */
export interface CategoryPool {
  id: string;
  categoryName: string;
  enabled: boolean;
  isCustom?: boolean;
  items: CategoryItem[];
}

/**
 * Interface representing configuration settings of the game, including:
 * number of clue rounds per player,
 * discussion time in seconds, and
 * whether the chameleon can last-resort-guess or not.
 */
export interface GameConfig {
  clueRounds: number;
  discussionTimeSeconds: number;
  chameleonLastResort: boolean;
}

/**
 * Enum representing all the Socket event types.
 */
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

// --- PAYLOAD INTERFACES ---
// Note: Not all Socket.IO events currently have dedicated payload interfaces.
// Some handlers construct or extract the required data directly.
// For consistency and maintainability, we will define interfaces for all event payloads in the future.

// Client -> Server payloads
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

// Server -> Client payload
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

/**
 * Interface representing a single player data transfer object.
 */
export interface PlayerDto {
  socketId: string;
  username: string;
  isHost: boolean;
  role?: string;
}
