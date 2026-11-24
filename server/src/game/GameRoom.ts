/**
- Aggregate root managing the state and behavior of a single game room.
- - Tracks connected players, host status, and active roles.
- - Holds the active category pool and secret word for the current round.
- - Delegates phase-specific logic (clues, votes, transitions) to the current GameState.
 */

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

export class GameRoom {
  public roomId: string;
  private emit: (target: string, event: string, payload: any) => void;
  public players: Map<string, Player>;
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
- Adds a new player to the room. If they are the first player, assign them as host.
   */
  public addPlayer(socketId: string, username: string): Player {
    const isHost = this.players.size === 0;
    const player = new Player(socketId, username, isHost);
    this.players.set(socketId, player);
    return player;
  }

  /**
- Removes a player from the room by their socket ID.
   */
  public removePlayer(socketId: string): void {
    this.players.delete(socketId);
  }

  /**
- Allows the host to toggle a category on/off while keeping it in the pool.
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
- Allows the host to toggle an individual item inside a category on/off.
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
   * Creates or updates the room's single custom category (at least 1 valid word).
   */
  public saveCustomCategory(categoryName: string, words: string[]): void {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      throw new Error("Custom category name cannot be empty.");
    }

    const cleanedWords = Array.from(
      new Set(words.map((w) => w.trim()).filter((w) => w.length > 0)),
    );

    if (cleanedWords.length < 1) {
      throw new Error("Custom category must include at least 1 word.");
    }

    const existingIndex = this.categoryPool.findIndex((cat) => cat.isCustom);
    const items = cleanedWords.map((word, idx) => ({
      id:
        existingIndex !== -1
          ? `custom-item-${idx + 1}`
          : `custom-item-${idx + 1}`,
      word,
      enabled: true,
    }));

    const customPool: CategoryPool = {
      id:
        existingIndex !== -1
          ? this.categoryPool[existingIndex]!.id
          : "cat-custom",
      categoryName: trimmedName,
      enabled: true,
      isCustom: true,
      items,
    };

    if (existingIndex !== -1) {
      this.categoryPool[existingIndex] = customPool;
    } else {
      this.categoryPool.push(customPool);
    }
  }

  /**
- Constructs a json payload containing room state information.
- Then broadcasts it to all connected clients via Socket.IO. (By calling this.broadcast(event, payload))
   */
  public broadcastState(): void {
    const isGameOver = this.currentState.gamePhase === GamePhase.GAME_OVER;

    const publicPlayers = Array.from(this.players.values()).map(
      (player): PlayerDto => ({
        socketId: player.socketId,
        username: player.username,
        isHost: player.isHost,
        score: player.score,
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
- Sends payload to one individual socket connection.
- Use this for private information, such as the player's role.
- @param targetId
- @param eventType
- @param payload
   */
  public sendPrivate(
    targetId: string,
    eventType: SocketEvent,
    payload: any,
  ): void {
    this.emit(targetId, eventType, payload);
  }

  /**
   * @Author Alex
   *
   * Returns true if the room is able to be joined by an incoming player.
   *
   * TODO:
   *
   * This function doesn't do anything right now but if a player limit is added to the room config options in the future, or other factors like that, this function can
   * check for it.
   *
   * @returns Boolean representing if the room is able to be joined by an incoming player
   */
  public canJoin(): Boolean {
    return true;
  }
}
