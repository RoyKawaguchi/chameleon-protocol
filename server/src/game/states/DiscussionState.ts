/**
 * Manages the open chat discussion phase:
 * - Runs an absolute timestamp timer (`timerEndsAt`) for client synchronization.
 * - Supports host facilitator overrides to cut discussion short or extend time.
 * - Automatically transitions to VotingState when time expires.
 */

import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { VotingState } from "./VotingState";
import { GamePhase } from "../../models/types";
import { SocketEvent } from "../../models/types";
import { ChatTextMessage } from "../../models/Message";

export class DiscussionState extends GameState {
  public timerEndsAt: number = 0;

  constructor() {
    super();
    this.gamePhase = GamePhase.DISCUSSION;
  }

  public onEnter(room: GameRoom): void {
    // TODO (Should): Idea for timer
    // const durationMs = 300 * 1000; // (300 seconds times 1000 ms/s)
    // this.timerEndsAt = Date.now() + durationMs;
    // Broadcast state payload containing timerEndsAt to clients
  }

  /**
   *
   * @param room
   * @param player
   * @param payload
   */
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any
  ): void {
    if (event == SocketEvent.SEND_CHAT) {
      // TODO: Broadcast chat text message to room. Something like this?
      // 1. Add message to GameRoom
      //   room.chatTextMessages.push(new ChatTextMessage(player, payload.content));
      // 2. Broadcast the new state
      //   room.broadcastState();
    }
    // TODO (Should): write else-if blocks for cutting discussion short
    // or extending discussion.
    // (Ensure player.isHost is true)
    else {
      // TODO: throw an error for requesting handleAction with wrong event
    }
  }

  public transitionNext(room: GameRoom): void {
    // room.currentState = new VotingState();
    // room.currentState.onEnter?.(room);
  }
}
