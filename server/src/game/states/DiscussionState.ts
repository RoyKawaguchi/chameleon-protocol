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
  private timerHandler: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.gamePhase = GamePhase.DISCUSSION;
  }

  public onEnter(room: GameRoom): void {
    // TODO (Should): Idea for timer
    const durationMs = room.config.discussionTimeSeconds * 1000; // (300 seconds times 1000 ms/s)
    this.timerEndsAt = Date.now() + durationMs;
    // Broadcast state payload containing timerEndsAt to clients
    room.broadcastState();

    this.timerHandler = setTimeout(() =>{
      //advane to next state if this state is still active
      if (room.currentState==this) {
        this.transitionNext(room);
      }
    }, durationMs);
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
      // Validate that chat content exists and is a valid string
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

      // 1. Add message to GameRoom chat log
      const chatMsg = new ChatTextMessage(player, payload.content.trim());
      room.chatTextMessages.push(chatMsg);

      // 2. Broadcast the new state so all clients update their chat feeds
      room.broadcastState();
    }
    // TODO (Should): write else-if blocks for cutting discussion short
    // or extending discussion.
    // (Ensure player.isHost is true)
    else {
      // Send a private error message to the user if an invalid action is triggered
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: "Invalid action received during the Discussion Phase.",
      });
    }
  }

  public transitionNext(room: GameRoom): void {
    room.currentState = new VotingState();
    room.currentState.onEnter?.(room);
  }
}
