/**
 * Aggregate root managing the state and behavior of a single game room.
 * - Tracks connected players, host status, and active roles.
 * - Holds the active category pool and secret word for the current round.
 * - Delegates phase-specific logic (clues, votes, transitions) to the current GameState.
 */

import { Player } from "../models/Player";
import { GameConfig, CategoryPool } from "../models/types";
import { GameState } from "./states/GameState";
import { LobbyState } from "./states/LobbyState";

export class GameRoom {
  public roomId: string;
  private broadcast: (event: string, payload: any) => void;
  public players: Map<string, Player>; // socketId -> Player (prevent two Player objects with same socketID)
  public categoryPool: CategoryPool[];
  public activeCategory: string | undefined;
  public secretWord: string | null;
  public config: GameConfig;
  public currentState: GameState;

  constructor(
    roomId: string,
    broadcast: (event: string, payload: any) => void
  ) {
    this.roomId = roomId;
    this.broadcast = broadcast;
    this.players = new Map<string, Player>();
    this.categoryPool = [
      {
        categoryName: "Animals",
        categories: ["Elephant", "Dolphin", "Penguin", "Kangaroo", "Giraffe"],
      },
      {
        categoryName: "Food",
        categories: ["Pizza", "Sushi", "Tacos", "Burger", "Ramen"],
      },
    ];
    this.activeCategory = this.categoryPool[0]?.categoryName;
    this.secretWord = null;
    this.config = {
      clueRounds: 1,
    };
    this.currentState = new LobbyState();
  }

  /**
   * Adds a new player to the room. If they are the first player, assign them as host.
   */
  public addPlayer(socketId: string, username: string): Player {
    const isHost = this.players.size === 0;
    const player = new Player(socketId, username, isHost);
    this.players.set(socketId, player);
    return player;
  }

  /**
   * Removes a player from the room by their socket ID.
   */
  public removePlayer(socketId: string): void {
    this.players.delete(socketId);
  }

  /**
   * Allows the host to toggle a preset category or item on/off.
   */
  public toggleCategory(categoryName: string): void {}

  /**
   * Transitions the room into the game lifecycle (from Lobby into CluePhase).
   */
  public startGame(): void {}

  /**
   * Constructs a json payload containing room state information.
   * Then broadcasts it to all connected clients via Socket.IO. (By calling this.broadcast(event, payload))
   */
  public broadcastState(): void {}
}
