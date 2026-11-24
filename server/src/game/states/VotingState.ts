/**
 * Manages secret accusation votes:
 * - Tabulates votes synchronously once all players have submitted.
 * - Handles tie-breaker conditions (prioritizing host or resolving deterministically).
 * - Track voting progress
 * - Keeps individual votes private =
 * - allows player to change vote until vote is cast
 */

import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GameOverState } from "./GameOverState";
import { GamePhase, SocketEvent } from "../../models/types";

export class VotingState extends GameState {
  private votes: Map<string, string> = new Map(); // voterSocketId -> targetSocketId
  private accusedPlayer: Player | null;

  constructor() {
    super();
    this.gamePhase = GamePhase.VOTING;
    this.accusedPlayer = null;
  }

  public onEnter(room: GameRoom): void {
    room.broadcastState();
  }

  public getVotesSubmitted(): number {
    return this.votes.size;
  }

  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any
  ): void {
    if (event !== SocketEvent.CAST_VOTE) {
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: "Invalid action received during the Voting Phase.",
      });
      return;
    }

    try {
      if (!payload || typeof payload.targetId !== "string") {
        throw new Error("Target player ID is missing or invalid.");
      }

      const targetPlayer = room.players.get(payload.targetId);
      
      if (!targetPlayer) {
        throw new Error("Target player not found in room.");
      }

      // Record or update vote
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

  private processVotes(room: GameRoom): void {
    const voteCounts = new Map<string, number>();
    for (const targetSocketId of this.votes.values()) {
      voteCounts.set(targetSocketId, (voteCounts.get(targetSocketId) || 0) + 1);
    }

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

    let accusedSocketId: string;

    // Tie-breaker: if tied, select the host among tied players or default to the first tied player
    if (mostVotedSocketIds.length > 1) {
      const hostTied = mostVotedSocketIds.find(
        (id) => room.players.get(id)?.isHost
      );
      accusedSocketId = hostTied || mostVotedSocketIds[0]!;
    } else {
      accusedSocketId = mostVotedSocketIds[0]!;
    }

    const accusedPlayer = room.players.get(accusedSocketId);
    if (!accusedPlayer) {
      const fallback = room.players.values().next().value;
      if (!fallback) throw new Error("No players available in room.");
      this.accusedPlayer = fallback;
      this.transitionNext(room);
      return;
    }
    this.accusedPlayer = accusedPlayer;
    this.transitionNext(room);
  }

  public transitionNext(room: GameRoom): void {
    if (!this.accusedPlayer)
      throw new Error("Cannot transition without a single accused player.");
    room.currentState = new GameOverState(this.accusedPlayer);
    room.currentState.onEnter?.(room);

    room.broadcastState();
  }
}
