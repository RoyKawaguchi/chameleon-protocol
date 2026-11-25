import { Player } from "../../models/Player";
import { ClueMessage } from "../../models/Message";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GamePhase } from "../../models/types";
import { DiscussionState } from "./DiscussionState";
import { SocketEvent } from "../../models/types";

/**
 * Concrete class representing the clue phase game state.
 * Previous state: LobbyState, Next state: DiscussionState.
 * Only accepts clues in established player order.
 */
export class CluePhaseState extends GameState {
  protected readonly playerOrder: readonly Player[];
  protected currentRound: number;
  protected currentTurnHolder: Player | undefined;
  protected readonly clueRoundLimit: number;
  protected submittedClueTexts: Set<string> = new Set(); // Tracks lowercase clues to prevent duplicates across the game

  /**
   * Constructor of CluePhaseState.
   * @param playerOrder array of Player objects in generated randomized order
   * @param clueRoundLimit total max number of clue rounds
   */
  constructor(playerOrder: readonly Player[], clueRoundLimit: number) {
    super();
    this.gamePhase = GamePhase.CLUE_PHASE;
    this.currentRound = 1;
    this.clueRoundLimit = clueRoundLimit;
    this.playerOrder = [...playerOrder];
    this.currentTurnHolder = playerOrder[0];
  }

  /**
   * Broadcast the latest room state to ensure players enter CluePhaseState.
   * @param room GameRoom object
   */
  public onEnter?(room: GameRoom): void {
    room.broadcastState();
  }

  // Expected events:
  // SUBMIT_CLUE
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any,
  ): void {
    if (event != SocketEvent.SUBMIT_CLUE) {
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: "Invalid action received during the Clue Phase.",
      });
      return;
    }

    try {
      if (!payload || typeof payload.clueText !== "string") {
        throw new Error("Clue text payload is missing or invalid.");
      }

      const trimmedClueText = payload.clueText.trim();

      // Construct Message object
      const clueMsg = new ClueMessage(
        player,
        trimmedClueText,
        this.currentRound,
      );

      // Validate player and clueMsg
      this.validateRound(room, player, clueMsg);

      // Record clue in GameRoom and track its lowercase form
      room.clueMessages.push(clueMsg);
      this.submittedClueTexts.add(trimmedClueText.toLowerCase());

      // Check how many players have submitted a clue in the current round
      const cluesInCurrentRound = room.clueMessages.filter(
        (c) => c.roundNumber === this.currentRound,
      ).length;

      // Determine if every player has finished their turn for this round
      if (cluesInCurrentRound === this.playerOrder.length) {
        // Determine if this was the last round
        if (this.currentRound >= this.clueRoundLimit) {
          this.transitionNext(room);
          return;
        } else {
          this.currentRound++;
          this.currentTurnHolder = this.playerOrder[0]; // Reset turn back to first player
        }
      } else {
        // Make currentTurnHolder the next up on playerOrder
        const currentIndex = this.playerOrder.findIndex(
          (p) => p.socketId === player.socketId,
        );
        if (currentIndex !== -1 && currentIndex + 1 < this.playerOrder.length) {
          this.currentTurnHolder = this.playerOrder[currentIndex + 1];
        }
      }

      // Broadcast if all goes well
      room.broadcastState();
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while submitting your clue.";
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: errorMsg,
      });
    }
  }

  /**
   * Validates that the Player is supposed to send a clue at the current state.
   * Validates the clue content as well.
   * If any validation fails, an Error is thrown.
   * @param room GameRoom object
   * @param player Player object of the sender
   * @param clueMsg ClueMessage object
   */
  protected validateRound(
    room: GameRoom,
    player: Player,
    clueMsg: ClueMessage,
  ): void {
    // 1. We have reached the max clue count
    if (this.currentRound > this.clueRoundLimit) {
      throw new Error("The clue phase has already concluded.");
    }

    // 2. It is not their turn
    if (
      !this.currentTurnHolder ||
      this.currentTurnHolder.socketId !== player.socketId
    ) {
      throw new Error(
        `It is not your turn. Waiting for ${
          this.currentTurnHolder?.username || "the next player"
        }.`,
      );
    }

    // 3. They have already submitted a clue in the current round
    const alreadySubmittedThisRound = room.clueMessages.some(
      (c) =>
        c.roundNumber === this.currentRound &&
        c.sender.socketId === player.socketId,
    );
    if (alreadySubmittedThisRound) {
      throw new Error("You have already submitted your clue for this round.");
    }

    const normalizedClue = clueMsg.content.toLowerCase();

    // 4. The clue is already used
    if (this.submittedClueTexts.has(normalizedClue)) {
      throw new Error(
        "This clue has already been used in this game. Please choose a unique word!",
      );
    }

    // 5. Clue content is empty/too long
    if (clueMsg.content.length === 0 || clueMsg.content.length > 15) {
      throw new Error("Clue must be between 1 and 15 characters long.");
    }
  }

  public transitionNext(room: GameRoom): void {
    room.currentState = new DiscussionState();
    room.currentState.onEnter?.(room);
  }
}
