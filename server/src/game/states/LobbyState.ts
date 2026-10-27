import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { CluePhaseState } from "./CluePhaseState";
import { SocketEvent, Role } from "../../models/types";

export class LobbyState extends GameState {
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any
  ): void {
    // All lobby actions can only be done by host
    if (!player.isHost) {
      return;
    }
    // TODO: add other action handlers like for toggling categories or changing configuration.

    if (payload.action == SocketEvent.START_GAME) {
      // TODO: read payload.category and validate it (make sure it is in GameRoom.categoryPool)
      this.transitionNext(room);
    }
  }

  /**
   * Transition to CluePhaseState. Initializes the game.
   * @param room
   */
  public transitionNext(room: GameRoom): void {
    if (room.players.size < 4) {
      throw new Error("Cannot start game with fewer than 4 players.");
    }

    // TODO:
    // 1. Assign roles
    // 2. Randomly select secret word
    // 3. Establish random order and pass it to constructor of CluePhaseState

    // room.currentState = new CluePhaseState();
    // room.currentState.onEnter?.(room);
  }
}
