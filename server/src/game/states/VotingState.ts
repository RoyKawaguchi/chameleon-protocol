/**
 * Manages secret accusation votes:
 * - Tabulates votes synchronously once all players have submitted.
 * - Re-votes on any tie (allowing unrestricted voting again) while recording tied players.
 * - Tracks voting progress and keeps individual votes private.
 * - Allows a player to change their vote until all players have submitted.
 */

import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GameOverState } from "./GameOverState";
import { GamePhase, SocketEvent } from "../../models/types";

export class VotingState extends GameState {
  protected votes: Map<string, string> = new Map(); // voterSocketId -> targetSocketId
  protected accusedPlayer: Player | null;
  protected revoteActive: boolean = false;
  protected tiedPlayers: Array<{ socketId: string; username: string }> = [];

  constructor() {
    super();
    this.gamePhase = GamePhase.VOTING;
    this.accusedPlayer = null;
  }

  public onEnter(room: GameRoom): void {
    this.votes.clear();
    this.revoteActive = false;
    this.tiedPlayers = [];
    room.broadcastState();
  }

  public getVotesSubmitted(): number {
    return this.votes.size;
  }

  public isRevote(): boolean {
    return this.revoteActive;
  }

  public getTiedPlayers(): Array<{ socketId: string; username: string }> {
    return this.tiedPlayers.map((p) => ({ ...p }));
  }

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
      if (!payload || typeof payload.targetId !== "string") {
        throw new Error("Target player ID is missing or invalid.");
      }

      const targetPlayer = room.players.get(payload.targetId);

      if (!targetPlayer) {
        throw new Error("Target player not found in room.");
      }

      // Record or update vote (self-votes and any active room player are allowed)
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

  protected processVotes(room: GameRoom): void {
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

    if (mostVotedSocketIds.length === 0) {
      throw new Error("No votes were recorded.");
    }

    // If tied, clear votes and trigger an unrestricted re-vote
    if (mostVotedSocketIds.length > 1) {
      this.tiedPlayers = mostVotedSocketIds
        .map((id) => room.players.get(id))
        .filter((p): p is Player => Boolean(p))
        .map((p) => ({ socketId: p.socketId, username: p.username }));

      this.revoteActive = true;
      this.votes.clear();
      room.broadcastState();
      return;
    }

    const accusedSocketId = mostVotedSocketIds[0]!;
    const accusedPlayer = room.players.get(accusedSocketId);
    if (!accusedPlayer) {
      const fallback = room.players.values().next().value;
      if (!fallback) throw new Error("No players available in room.");
      this.accusedPlayer = fallback;
      this.transitionNext(room);
      return;
    }

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
