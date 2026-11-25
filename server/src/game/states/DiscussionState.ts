import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { VotingState } from "./VotingState";
import { GamePhase, SocketEvent } from "../../models/types";
import { ChatTextMessage } from "../../models/Message";

/**
 * Concrete class representing the discussion game state.
 * Previous state: CluePhaseState, Next state: VotingState.
 * Automatically moves on once timer expires.
 * Allows players to send chat messages.
 */
export class DiscussionState extends GameState {
  public timerEndsAt: number = 0;
  private timerHandler: ReturnType<typeof setTimeout> | null = null;

  /**
   * Constructor of DiscussionState.
   */
  constructor() {
    super();
    this.gamePhase = GamePhase.DISCUSSION;
  }

  /**
   * Clears preexisting timer.
   */
  private clearTimer(): void {
    if (this.timerHandler !== null) {
      clearTimeout(this.timerHandler);
      this.timerHandler = null;
    }
  }

  public onEnter(room: GameRoom): void {
    this.clearTimer();

    // Find end time and broadcast it
    const durationMs = room.config.discussionTimeSeconds * 1000;
    this.timerEndsAt = Date.now() + durationMs;
    room.broadcastState();

    // Transition once the timer ends
    this.timerHandler = setTimeout(() => {
      if (room.currentState === this) {
        this.transitionNext(room);
      }
    }, durationMs);
  }

  // Expected events:
  // SEND_CHAT, END_DISCUSSION
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any,
  ): void {
    if (event === SocketEvent.SEND_CHAT) {
      // Validate payload content
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

      // Construct new Message object
      const chatMsg = new ChatTextMessage(player, payload.content.trim());

      // Add it to GameRoom
      room.chatTextMessages.push(chatMsg);

      // Broadcast current state
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

      // Transition to VotingState if actor was Host
      this.transitionNext(room);
      return;
    }

    // Invalid action
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
