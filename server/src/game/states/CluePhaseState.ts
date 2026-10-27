import { Player } from "../../models/Player";
import { ClueMessage } from "../../models/Message";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { SocketEvent } from "../../models/types";

export class CluePhaseState extends GameState {
  private readonly playerOrder: readonly Player[];
  private currentRound: number;
  private currentTurnHolder: Player | undefined;
  private readonly clueRoundLimit: number;
  private submittedClues: ClueMessage[] = [];

  constructor(playerOrder: readonly Player[], clueRoundLimit: number) {
    super();
    this.currentRound = 1;
    this.clueRoundLimit = clueRoundLimit;
    this.playerOrder = [...playerOrder];
    this.currentTurnHolder = playerOrder[0];
  }

  public onEnter?(room: GameRoom): void {
    // TODO: emit a system message
  }

  public handleAction(room: GameRoom, player: Player, payload: any): void {
    try {
      this.validateRound(player, payload);

      const clueMsg = new ClueMessage(
        player,
        payload.clueText,
        this.currentRound
      );

      this.submittedClues.push(clueMsg);

      // TODO: Check whether the current round is complete.
      // If every player has submitted, advance currentRound.

      // Update currentTurnHolder accordingly.
      //
      // If all configured clue rounds are complete,
      // transition to DiscussionState.
    } catch (error: unknown) {
      // TODO: Emit a validation error to this player's socket.
    }
  }

  private validateRound(player: Player, payload: object): void {
    // TODO:
    // - Validate the clue text.
    // - Ensure the clue phase has not already completed.
    // - Ensure the player is supposed to submit a clue next,
    //   according to playerOrder.
    // - Ensure each player submits exactly once per round.
    // - Compute the expected round from submittedClues and
    //   ensure it is consistent with currentRound.
    // - Ensure the configured clue round limit is not exceeded.
    //
    // Example with playerOrder = [Alice, Bob, Charles, Roy]:
    //
    // Valid:
    // [Alice, Bob]
    // [Alice, Bob, Charles, Roy, Alice, Bob, Charles]
    //
    // Invalid:
    // [Alice, Roy, Bob]
    // (Roy submitted before Charles, so the turn order is violated.)
    //
    // Throw an error with an appropriate message if any
    // validation check fails.
  }

  public transitionNext(room: GameRoom): void {
    // TODO: Transition to DiscussionState once every player
    // has submitted a clue for every configured clue round.
  }
}
