/**
 * Abstract base class representing a state in the room's finite state machine.
 */

import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";

export abstract class GameState {
  /**
   * Handles player actions or inputs specific to the current phase.
   */
  public abstract handleAction(
    room: GameRoom,
    player: Player,
    payload: any
  ): void;

  /**
   * Governs the logic required to transition from the current state to the next.
   */
  public abstract transitionNext(room: GameRoom): void;

  /**
   * Optional lifecycle hook when entering a state (e.g., setting timers, shuffling turns).
   */
  public onEnter?(room: GameRoom): void;
}
