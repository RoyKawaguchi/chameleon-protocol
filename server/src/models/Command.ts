/**
 * Command Pattern Interface
 * Used to encapsulate player actions (clues, votes) in order to:
 * 1. audit logging
 * 2. prevent race conditions by creating a command queue
 */
export interface Command {
  id: string;
  timestamp: Date;
  playerId: string;
  playerUsername: string;
  actionType: "SUBMIT_CLUE" | "CAST_VOTE";
  payload: string;
  execute(): void;
}
