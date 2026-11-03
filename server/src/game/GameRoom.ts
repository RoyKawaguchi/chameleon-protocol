/**
 * Aggregate root managing the state and behavior of a single game room.
 * - Tracks connected players, host status, and active roles.
 * - Holds the active category pool and secret word for the current round.
 * - Delegates phase-specific logic (clues, votes, transitions) to the current GameState.
 */

import { ChatTextMessage, ClueMessage } from "../models/Message";
import { Player } from "../models/Player";
import { GameConfig, CategoryPool, SocketEvent } from "../models/types";
import { GameState } from "./states/GameState";
import { LobbyState } from "./states/LobbyState";

export class GameRoom {
  public roomId: string;
  private emit: (target: string, event: string, payload: any) => void;
  public players: Map<string, Player>; // socketId -> Player (prevent two Player objects with same socketID)
  public categoryPool: CategoryPool[];
  public activeCategory: string | undefined;
  public secretWord: string | null;
  public config: GameConfig;
  public currentState: GameState;
  public clueMessages: ClueMessage[];
  public chatTextMessages: ChatTextMessage[];

  constructor(
    roomId: string,
    emit: (target: string, event: string, payload: any) => void
  ) {
    this.roomId = roomId;
    this.emit = emit;
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
    this.clueMessages = [];
    this.chatTextMessages = [];
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
   * Constructs a json payload containing room state information.
   * Then broadcasts it to all connected clients via Socket.IO. (By calling this.broadcast(event, payload))
   */
  public broadcastState(): void {
    // Safe public player array. Does not contain role.
    const publicPlayers = Array.from(this.players.values()).map((player) => ({
      socketId: player.socketId,
      username: player.username,
      isHost: player.isHost,
      score: player.score,
    }));

    const payload = {
      roomId: this.roomId,
      gamePhase: this.currentState.gamePhase,
      players: publicPlayers, // Safe public array
      config: this.config,
      activeCategory: this.activeCategory,
    };

    this.emit(this.roomId, SocketEvent.ROOM_UPDATED, payload);
  }

  /**
   * Sends payload to one individual socket connection.
   * Use this for private information, such as the player's role.
   * @param targetId
   * @param payload
   */
  public sendPrivate(targetId: string, payload: any): void {
    this.emit(targetId, SocketEvent.ROLE_ASSIGNED, payload);
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
  public canJoin(): Boolean
  {
    return true;
  }
}
