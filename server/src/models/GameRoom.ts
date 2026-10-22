import { Player } from "./Player";
import { GameState } from "../states/GameState";
import { Command } from "./Command";

/**
 * GameRoom Aggregate Root
 * Manages player connections, category word pools, command logs, and active state transitions.
 */
export class GameRoom {
  public roomId: string;
  public categoryPool: Map<string, string[]>;
  public activeCategory: string | null = null;
  public secretWord: string | null = null;

  public players: Map<string, Player> = new Map(); // Key = socket ID, Value = Player object
  public currentState!: GameState;
  public commandHistory: Command[] = [];

  constructor(roomId: string) {
    this.roomId = roomId;
    this.categoryPool = new Map();
  }

  public addPlayer(player: Player): void {
    this.players.set(player.socketId, player);
  }

  public removePlayer(socketId: string): void {
    this.players.delete(socketId);
  }

  public setState(newState: GameState): void {
    this.currentState = newState;
  }
}
