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
import { GamePhase, SocketEvent } from "../../models/types";
import { ChatTextMessage } from "../../models/Message";

export class DiscussionState extends GameState {
  public timerEndsAt: number = 0;
  private timerHandler: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.gamePhase = GamePhase.DISCUSSION;
  }

  private clearTimer(): void {
    if (this.timerHandler !== null) {
      clearTimeout(this.timerHandler);
      this.timerHandler = null;
    }
  }

  public onEnter(room: GameRoom): void {
    this.clearTimer();
    const durationMs = room.config.discussionTimeSeconds * 1000;
    this.timerEndsAt = Date.now() + durationMs;
    room.broadcastState();

    this.timerHandler = setTimeout(() => {
      if (room.currentState === this) {
        this.transitionNext(room);
      }
    }, durationMs);
  }

  /**
   *
   * @param room
   * @param player
   * @param event
   * @param payload
   * @returns
   */
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any,
  ): void {
    if (event === SocketEvent.SEND_CHAT) {
      if (
        !payload ||
        typeof payload.content !== "string" ||
        !payload.content.trim()
      ) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Chat message content cannot be empty.",
        });
        return;
      }

      const chatMsg = new ChatTextMessage(player, payload.content.trim());
      room.chatTextMessages.push(chatMsg);
      room.broadcastState();
      return;
    }

    if (event === SocketEvent.END_DISCUSSION) {
      if (!player.isHost) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Only the host can cut discussion short.",
        });
        return;
      }

      this.transitionNext(room);
      return;
    }

    room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
      message: "Invalid action received during the Discussion Phase.",
    });
  }

  public transitionNext(room: GameRoom): void {
    this.clearTimer();
    room.currentState = new VotingState();
    room.currentState.onEnter?.(room);
  }
}
