import { Player } from "../../models/Player";
import { ClueMessage } from "../../models/Message";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GamePhase } from "../../models/types";
import { DiscussionState } from "./DiscussionState";
import { SocketEvent } from "../../models/types";

export class CluePhaseState extends GameState {
  private readonly playerOrder: readonly Player[];
  private currentRound: number;
  private currentTurnHolder: Player | undefined;
  private readonly clueRoundLimit: number;
  private submittedClues: ClueMessage[] = [];

  constructor(playerOrder: readonly Player[], clueRoundLimit: number) {
    super();
    this.gamePhase = GamePhase.CLUE_PHASE;
    this.currentRound = 1;
    this.clueRoundLimit = clueRoundLimit;
    this.playerOrder = [...playerOrder];
    this.currentTurnHolder = playerOrder[0];
  }

  public onEnter?(room: GameRoom): void {
    // TODO: emit a system message
    room.broadcastState();
  }

  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any
  ): void {
    if (event != SocketEvent.SUBMIT_CLUE) {
      // TODO: throw error
      return;
    }
    try {
      this.validateRound(player, payload);

      const clueMsg = new ClueMessage(
        player,
        payload.clueText,
        this.currentRound
      );

      this.submittedClues.push(clueMsg);

      // ---TEMPORARY---
      if (this.submittedClues.length >= 2) {
        this.transitionNext(room);
      }

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
    // TODO: Confirm that there is a correct number of clues.
    // e.g. if players.size == 4 and rounds = 2, there should've been 8 clues.
    // Then transition to new state

    room.currentState = new DiscussionState();
    room.currentState.onEnter?.(room);
  }
}
