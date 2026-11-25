import { ChatTextMessage, ClueMessage } from "../models/Message";
import { Player } from "../models/Player";
import {
  GameConfig,
  CategoryPool,
  GamePhase,
  Role,
  SocketEvent,
  RoomStatePayload,
  PlayerDto,
} from "../models/types";
import { GameState } from "./states/GameState";
import { LobbyState } from "./states/LobbyState";
import { DiscussionState } from "./states/DiscussionState";
import { VotingState } from "./states/VotingState";
import { GameOverState } from "./states/GameOverState";

/**
 * Aggregate root managing the state and behavior of a single game room.
 * - Tracks connected players, host status, and active roles.
 * - Holds the active category pool and secret word for the current round.
 * - Delegates phase-specific logic (clues, votes, transitions) to the current GameState.
 */
export class GameRoom {
  public roomId: string;
  private emit: (target: string, event: string, payload: any) => void; // callback function
  public players: Map<string, Player>; // This is a map, so as to avoid duplicate players
  public categoryPool: CategoryPool[];
  public activeCategory: string | undefined;
  public secretWord: string | null;
  public config: GameConfig;
  public currentState: GameState;
  public clueMessages: ClueMessage[];
  public chatTextMessages: ChatTextMessage[];

  constructor(
    roomId: string,
    emit: (target: string, event: string, payload: any) => void,
  ) {
    this.roomId = roomId;
    this.emit = emit;
    this.players = new Map<string, Player>();
    this.categoryPool = [
      {
        id: "cat-animals",
        categoryName: "Animals",
        enabled: true,
        isCustom: false,
        items: [
          { id: "animal-1", word: "Elephant", enabled: true },
          { id: "animal-2", word: "Dolphin", enabled: true },
          { id: "animal-3", word: "Penguin", enabled: true },
          { id: "animal-4", word: "Kangaroo", enabled: true },
          { id: "animal-5", word: "Giraffe", enabled: true },
          { id: "animal-6", word: "Crocodile", enabled: true },
          { id: "animal-7", word: "Flamingo", enabled: true },
          { id: "animal-8", word: "Octopus", enabled: true },
          { id: "animal-9", word: "Peacock", enabled: true },
          { id: "animal-10", word: "Leopard", enabled: true },
          { id: "animal-11", word: "Lion", enabled: true },
          { id: "animal-12", word: "Koala", enabled: true },
        ],
      },
      {
        id: "cat-food",
        categoryName: "Food",
        enabled: true,
        isCustom: false,
        items: [
          { id: "food-1", word: "Pizza", enabled: true },
          { id: "food-2", word: "Sushi", enabled: true },
          { id: "food-3", word: "Tacos", enabled: true },
          { id: "food-4", word: "Burger", enabled: true },
          { id: "food-5", word: "Ramen", enabled: true },
          { id: "food-6", word: "Pancake", enabled: true },
          { id: "food-7", word: "Lasagna", enabled: true },
          { id: "food-8", word: "Dumpling", enabled: true },
          { id: "food-9", word: "Sandwich", enabled: true },
          { id: "food-10", word: "Burrito", enabled: true },
          { id: "food-11", word: "Waffle", enabled: true },
          { id: "food-12", word: "Spaghetti", enabled: true },
        ],
      },
    ];
    this.secretWord = null;
    this.config = {
      clueRounds: 1,
      discussionTimeSeconds: 60,
      chameleonLastResort: true,
    };
    this.currentState = new LobbyState();
    this.clueMessages = [];
    this.chatTextMessages = [];
  }

  /**
   * Adds a new player to the room.
   * If they are the first player, assign them as host.
   * @param socketId Socket ID of the player being added
   * @param username Username of the player being added
   * @returns
   */
  public addPlayer(socketId: string, username: string): Player {
    const isHost = this.players.size === 0;
    const player = new Player(socketId, username, isHost);
    this.players.set(socketId, player);
    return player;
  }

  /**
   * Removes a player from the room by their socket ID.
   * @param socketId Socket ID of the player being removed
   */
  public removePlayer(socketId: string): void {
    this.players.delete(socketId);
  }

  /**
   * Allows the host to toggle a category on/off while keeping it in the pool.
   * @param categoryId ID of category being toggled
   * @returns boolean of whether toggling was successful
   */
  public toggleCategory(categoryId: string): boolean {
    const category = this.categoryPool.find((cat) => cat.id === categoryId);
    if (!category) {
      return false;
    }
    category.enabled = !category.enabled;
    return true;
  }

  /**
   * Allows the host to toggle an individual item inside a category on/off.
   * @param categoryId ID of category being toggled
   * @param itemId ID of item being toggled
   * @returns boolean of whether toggling was successful
   */
  public toggleCategoryItem(categoryId: string, itemId: string): boolean {
    const category = this.categoryPool.find((cat) => cat.id === categoryId);
    if (!category) {
      return false;
    }
    const item = category.items.find((entry) => entry.id === itemId);
    if (!item) {
      return false;
    }
    item.enabled = !item.enabled;
    return true;
  }

  /**
   * Creates or updates the room's single custom category
   * (at least 2 valid words).
   * @param categoryName name of the new custom category
   * @param words array of strings being added as items
   */
  public saveCustomCategory(categoryName: string, words: string[]): void {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      throw new Error("Custom category name cannot be empty.");
    }

    // Filter duplicates and empty words
    const cleanedWords = Array.from(
      new Set(words.map((w) => w.trim()).filter((w) => w.length > 0)),
    );

    if (cleanedWords.length < 2) {
      throw new Error("Custom category must include at least 2 word.");
    }

    // Find the index of the existing custom category (-1 if it doesn't exist)
    const existingIndex = this.categoryPool.findIndex((cat) => cat.isCustom);

    // Convert each cleaned word into a CategoryItem object
    const items = cleanedWords.map((word, idx) => ({
      id: `custom-item-${idx + 1}`, // generate ID for each custom item
      word,
      enabled: true,
    }));

    // Create the custom category object with its name and items
    const customPool: CategoryPool = {
      // Reuse the existing category ID or assign a new one
      id:
        existingIndex !== -1
          ? this.categoryPool[existingIndex]!.id
          : "cat-custom",
      categoryName: trimmedName,
      enabled: true,
      isCustom: true,
      items,
    };

    // Update existing custom category if one was found
    if (existingIndex !== -1) {
      this.categoryPool[existingIndex] = customPool;
    } else {
      // Otherwise, add the new custom category to the category pool.
      this.categoryPool.push(customPool);
    }
  }

  /**
- Constructs a json payload containing room state information.
- Then broadcasts it to all connected clients via Socket.IO. (By calling this.broadcast(event, payload))
   */

  /**
   * Constructs a json payload containing room state information.
   * Then broadcasts it to all connected clients via Socket.IO.
   */
  public broadcastState(): void {
    const isGameOver = this.currentState.gamePhase === GamePhase.GAME_OVER;

    const publicPlayers = Array.from(this.players.values()).map(
      (player): PlayerDto => ({
        socketId: player.socketId,
        username: player.username,
        isHost: player.isHost,
        ...(isGameOver ? { role: player.role } : {}),
      }),
    );

    const clueState = this.currentState as any;
    const timerEndsAt =
      this.currentState instanceof DiscussionState
        ? this.currentState.timerEndsAt
        : null;
    const votesSubmitted =
      this.currentState instanceof VotingState
        ? this.currentState.getVotesSubmitted()
        : 0;
    const votingState =
      this.currentState instanceof VotingState ? this.currentState : null;
    const gameOverState =
      this.currentState instanceof GameOverState ? this.currentState : null;

    const chameleon = Array.from(this.players.values()).find(
      (p) => p.role === Role.CHAMELEON,
    );

    const payload: RoomStatePayload = {
      roomId: this.roomId,
      gamePhase: this.currentState.gamePhase,
      players: publicPlayers,
      config: { ...this.config },
      categories: this.categoryPool.map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({ ...item })),
      })),
      activeCategory: this.activeCategory || null,
      secretWord: isGameOver ? this.secretWord : null,
      currentRound: clueState.currentRound ?? 1,
      timerEndsAt,
      currentTurnHolderSocketId: clueState.currentTurnHolder?.socketId ?? null,
      votesSubmitted,
      isRevote: votingState ? votingState.isRevote() : false,
      tiedPlayers: votingState ? votingState.getTiedPlayers() : [],
      winningFaction: gameOverState ? gameOverState.getWinningFaction() : null,
      awaitingLastResortGuess: gameOverState
        ? gameOverState.isAwaitingLastResortGuess()
        : false,
      chameleonGuessResult: gameOverState
        ? gameOverState.getChameleonGuessResult()
        : null,
      accusedPlayer: gameOverState
        ? {
            socketId: gameOverState.getAccusedPlayer().socketId,
            username: gameOverState.getAccusedPlayer().username,
          }
        : null,
      chameleonPlayer:
        isGameOver && chameleon
          ? {
              socketId: chameleon.socketId,
              username: chameleon.username,
            }
          : null,
      clueMessages: this.clueMessages.map((msg) => ({
        sender: {
          socketId: msg.sender.socketId,
          username: msg.sender.username,
        },
        content: msg.content,
        roundNumber: msg.roundNumber,
      })),
      chatTextMessages: this.chatTextMessages.map((msg) => ({
        sender: {
          socketId: msg.sender.socketId,
          username: msg.sender.username,
        },
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    };

    this.emit(this.roomId, SocketEvent.ROOM_UPDATED, payload);
  }

  /**
   * Sends payload to one individual socket connection.
   * Use this for private information, such as the player's role or for error messages.
   * @param targetId Socket ID of desired recipient
   * @param eventType SocketEvent type
   * @param payload JSON payload to be sent
   */
  public sendPrivate(
    targetId: string,
    eventType: SocketEvent,
    payload: any,
  ): void {
    this.emit(targetId, eventType, payload);
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  /**
   * @Author Alex
   *
   * Returns true if the room is able to be joined by an incoming player.
   *
   * @returns Boolean representing if the room is able to be joined by an incoming player
   */
  public canJoin(): boolean {
    return (
      this.players.size < 8 && this.currentState.gamePhase === GamePhase.LOBBY
    );
  }
}
