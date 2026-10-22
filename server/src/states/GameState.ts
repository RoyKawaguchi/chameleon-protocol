import { GameRoom } from "../models/GameRoom";
import { Player } from "../models/Player";

/**
 * State Pattern Abstract Class
 * Defines state transition behavior and action handlers across room phases.
 */
export abstract class GameState {
  public abstract readonly stateName: string;

  public abstract handleClue(
    room: GameRoom,
    player: Player,
    clue: string
  ): void;

  public abstract handleVote(
    room: GameRoom,
    voter: Player,
    targetId: string
  ): void;

  public abstract transitionNext(room: GameRoom): void;
}
