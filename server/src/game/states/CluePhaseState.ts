import { Player } from "../../models/Player";
import { ClueMessage } from "../../models/Message";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GamePhase } from "../../models/types";
import { DiscussionState } from "./DiscussionState";
import { SocketEvent } from "../../models/types";

export class CluePhaseState extends GameState {
  protected readonly playerOrder: readonly Player[];
  protected currentRound: number;
  protected currentTurnHolder: Player | undefined;
  protected readonly clueRoundLimit: number;
  protected submittedClueTexts: Set<string> = new Set(); // Tracks lowercase clues to prevent duplicates across the game

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

      const clueMsg = new ClueMessage(
        player,
        trimmedClueText,
        this.currentRound,
      );

      // Validate using room as the single source of truth for clues
      this.validateRound(room, player, clueMsg);

      // Record the clue in GameRoom and track its lowercase form
      room.clueMessages.push(clueMsg);
      this.submittedClueTexts.add(trimmedClueText.toLowerCase());

      // Check how many players have submitted a clue in the current round
      const cluesInCurrentRound = room.clueMessages.filter(
        (c) => c.roundNumber === this.currentRound,
      ).length;

      // Determine if every player has finished their turn for this round
      if (cluesInCurrentRound === this.playerOrder.length) {
        if (this.currentRound >= this.clueRoundLimit) {
          this.transitionNext(room);
          return;
        } else {
          this.currentRound++;
          this.currentTurnHolder = this.playerOrder[0]; // Reset turn back to first
        }
      } else {
        const currentIndex = this.playerOrder.findIndex(
          (p) => p.socketId === player.socketId,
        );
        if (currentIndex !== -1 && currentIndex + 1 < this.playerOrder.length) {
          this.currentTurnHolder = this.playerOrder[currentIndex + 1];
        }
      }

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

  protected validateRound(
    room: GameRoom,
    player: Player,
    clueMsg: ClueMessage,
  ): void {
    if (this.currentRound > this.clueRoundLimit) {
      throw new Error("The clue phase has already concluded.");
    }

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

    const alreadySubmittedThisRound = room.clueMessages.some(
      (c) =>
        c.roundNumber === this.currentRound &&
        c.sender.socketId === player.socketId,
    );
    if (alreadySubmittedThisRound) {
      throw new Error("You have already submitted your clue for this round.");
    }

    const normalizedClue = clueMsg.content.toLowerCase();

    if (this.submittedClueTexts.has(normalizedClue)) {
      throw new Error(
        "This clue has already been used in this game. Please choose a unique word!",
      );
    }
  }

  public transitionNext(room: GameRoom): void {
    room.currentState = new DiscussionState();
    room.currentState.onEnter?.(room);
  }
}
