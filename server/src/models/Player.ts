/**
 * Represents an individual participant in a GameRoom.
 * Uses attributes rather than complex inheritance to avoid combinatorial
 * explosion between host status, roles, and connection states.
 */

import { Role } from "./types";

export class Player {
  public readonly socketId: string;
  public readonly username: string;
  public readonly isHost: boolean;
  public readonly role: Role;
  public readonly score: number;

  constructor(socketId: string, username: string, isHost: boolean = false) {
    this.socketId = socketId;
    this.username = username;
    this.isHost = isHost;
    this.role = Role.AGENT; // Default until assigned by game start
    this.score = 0;
  }

  /**
   * Submits a single-word clue during the CluePhase.
   */
  public submitClue(clue: string): void {
    // Validation handled by the state machine / game rules engine
  }

  /**
   * Casts an accusation vote onto another player's socketId during VotingState.
   */
  public castVote(targetId: string): void {
    // Vote registration logic
  }
}
