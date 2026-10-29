/**
 * Manages secret accusation votes:
 * - Tabulates votes synchronously once all players have submitted.
 * - Handles tie-breaker conditions by allowing the host to choose a re-vote or time extension.
 */

import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GameOverState } from "./GameOverState";
import { GamePhase } from "../../models/types";
import { SocketEvent } from "../../models/types";

export class VotingState extends GameState {
  private votes: Map<Player, Player> = new Map(); // voter -> target
  private mostVotedPlayer: Player;

  constructor() {
    super();
    this.gamePhase = GamePhase.VOTING;
  }

  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any
  ): void {
    if (event == SocketEvent.CAST_VOTE) {
      const targetPlayer = room.players.get(payload.targetId);

      if (!targetPlayer) {
        // TODO: Throw error since target player wasn't found
        return;
      }

      this.votes.set(player, targetPlayer);

      // Once all players have voted, evaluate results
      if (this.votes.size >= room.players.size) {
        this.processVotes(room);
      }
    } else {
      // TODO: throw an error for requesting handleAction with wrong event
    }
  }

  private processVotes(room: GameRoom): void {
    // 1. Count votes per player
    // 2. Check for ties. If tied, choose 1 arbitrarily for now.
    // 3. Once target is found, assign it to mostVotedPlayer
    // this.mostVotedplayer =
    // this.transitionNext(room);
  }

  public transitionNext(room: GameRoom): void {
    // room.currentState = new GameOverState(mostVotedPlayer);
  }
}
