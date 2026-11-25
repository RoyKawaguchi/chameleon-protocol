import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GameOverState } from "./GameOverState";
import { GamePhase, SocketEvent } from "../../models/types";

/**
 * Concrete class representing the voting game state.
 * Previous state: DiscussionState, Next state: GameOverState.
 * Tabulates votes synchronously once all players have submitted.
 * Goes to re-voting on any tie while recording tied players.
 * Tracks voting progress.
 * Allows players to change their vote until all players have submitted.
 */
export class VotingState extends GameState {
  private votes: Map<string, string> = new Map(); // voterSocketId -> targetSocketId
  private accusedPlayer: Player | null;
  private revoteActive: boolean = false; // whether we will have a revote next
  private tiedPlayers: Array<{ socketId: string; username: string }> = [];

  /**
   * Constructor of the VotingState
   */
  constructor() {
    super();
    this.gamePhase = GamePhase.VOTING;
    this.accusedPlayer = null;
  }

  public onEnter(room: GameRoom): void {
    // Clear any preexisting votes (in case of re-voting)
    this.votes.clear();
    this.revoteActive = false;
    this.tiedPlayers = [];
    room.broadcastState();
  }

  /**
   * Returns the number of votes that have already been submitted
   * @returns Number of votes that have been submitted
   */
  public getVotesSubmitted(): number {
    return this.votes.size;
  }

  /**
   * Getter of isRevote (whether we will have a revote next instead of GameOver)
   * @returns this.revoteActive
   */
  public isRevote(): boolean {
    return this.revoteActive;
  }

  /**
   * Getter of tied players.
   * @returns Array of objects containing socketId and username of tied players.
   */
  public getTiedPlayers(): Array<{ socketId: string; username: string }> {
    return this.tiedPlayers.map((p) => ({ ...p }));
  }

  // Expected events:
  // CAST_VOTE
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any,
  ): void {
    if (event !== SocketEvent.CAST_VOTE) {
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: "Invalid action received during the Voting Phase.",
      });
      return;
    }

    try {
      // Validate target player ID
      if (!payload || typeof payload.targetId !== "string") {
        throw new Error("Target player ID is missing or invalid.");
      }

      const targetPlayer = room.players.get(payload.targetId);

      if (!targetPlayer) {
        throw new Error("Target player not found in room.");
      }

      // Record or update vote (self-votes allowed)
      this.votes.set(player.socketId, targetPlayer.socketId);
      room.broadcastState();

      // Once all connected players have voted, evaluate results
      if (this.votes.size >= room.players.size) {
        this.processVotes(room);
      }
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while casting your vote.";
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: errorMsg,
      });
    }
  }

  /**
   * Processes all the votes. Only called after all players have submitted votes.
   * @param room GameRoom object
   * @returns void
   */
  private processVotes(room: GameRoom): void {
    // Map of Socket ID -> Vote count
    const voteCounts = new Map<string, number>();

    for (const targetSocketId of this.votes.values()) {
      voteCounts.set(targetSocketId, (voteCounts.get(targetSocketId) || 0) + 1);
    }

    // Find max voted players
    let maxVotes = -1;
    let mostVotedSocketIds: string[] = [];

    for (const [targetSocketId, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedSocketIds = [targetSocketId];
      } else if (count === maxVotes) {
        mostVotedSocketIds.push(targetSocketId);
      }
    }

    if (mostVotedSocketIds.length === 0) {
      throw new Error("No votes were recorded.");
    }

    // If tied, clear votes and trigger an unrestricted re-vote
    if (mostVotedSocketIds.length > 1) {
      this.tiedPlayers = mostVotedSocketIds
        .map((id) => room.players.get(id))
        .filter((p): p is Player => Boolean(p))
        .map((p) => ({ socketId: p.socketId, username: p.username }));

      // Set revoteActive to true
      this.revoteActive = true;

      // Clear votes
      this.votes.clear();

      // Broadcast
      room.broadcastState();
      return;
    }

    // There is a singlemost accused player. No revoting
    const accusedSocketId = mostVotedSocketIds[0]!;
    const accusedPlayer = room.players.get(accusedSocketId);
    if (!accusedPlayer) {
      const fallback = room.players.values().next().value;
      if (!fallback) throw new Error("No players available in room.");
      this.accusedPlayer = fallback;
      this.transitionNext(room);
      return;
    }

    // VotingState complete. Clear all fields and transition to GameOver
    this.revoteActive = false;
    this.tiedPlayers = [];
    this.accusedPlayer = accusedPlayer;
    this.transitionNext(room);
  }

  public transitionNext(room: GameRoom): void {
    if (!this.accusedPlayer)
      throw new Error("Cannot transition without a single accused player.");
    room.currentState = new GameOverState(this.accusedPlayer);
    room.currentState.onEnter?.(room);
  }
}
