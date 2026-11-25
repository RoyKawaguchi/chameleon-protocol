import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { LobbyState } from "./LobbyState";
import { GamePhase, SocketEvent, Role } from "../../models/types";

/**
 * Concrete class for the game over game state.
 * Previous state: VotingState, Next state: LobbyState.
 * Handles Chameleon's last resort guess if applicable.
 * Broadcasts post-game info, including result, secret word, identity of CHAMELEON, etc.
 * Allows host to reset and return the group to lobby.
 */
export class GameOverState extends GameState {
  private accusedPlayer: Player;
  private winningFaction: "AGENTS" | "CHAMELEON" = "AGENTS";
  private chameleonGuessResult: boolean | null = null;
  private awaitingLastResortGuess: boolean = false;

  /**
   * Constructor of the GameOverState
   * @param accusedPlayer Player object of the accused player
   */
  constructor(accusedPlayer: Player) {
    super();
    this.gamePhase = GamePhase.GAME_OVER;
    this.accusedPlayer = accusedPlayer;
  }

  /**
   * Getter of accused player
   * @returns Player object of the accused player
   */
  public getAccusedPlayer(): Player {
    return this.accusedPlayer;
  }

  /**
   * Getter of winning faction (string)
   * @returns either "AGENTS" or "CHAMELEON"
   */
  public getWinningFaction(): "AGENTS" | "CHAMELEON" {
    return this.winningFaction;
  }

  /**
   * Getter of the result of last-resort guess
   * @returns Boolean of result of last-resort guess
   */
  public getChameleonGuessResult(): boolean | null {
    return this.chameleonGuessResult;
  }

  /**
   * Getter of whether it is awaiting last-resort guess
   * @returns Boolean of whether it is awaiting last-resort guess
   */
  public isAwaitingLastResortGuess(): boolean {
    return this.awaitingLastResortGuess;
  }

  /**
   * Determine the result by checking if accusedPlayer is CHAMELEON
   * If last-resort is enabled, prepare for last-resort guess
   * @param room GameRoom object
   */
  public onEnter(room: GameRoom): void {
    if (this.accusedPlayer.role !== Role.CHAMELEON) {
      // Loyal Agent (or non-Chameleon) was accused -> Chameleon wins immediately regardless of config
      this.winningFaction = "CHAMELEON";
      this.awaitingLastResortGuess = false;
      this.chameleonGuessResult = null;
    } else if (room.config.chameleonLastResort) {
      // Chameleon was caught, and Last Resort is ON -> wait for Chameleon's secret word guess
      this.awaitingLastResortGuess = true;
      this.chameleonGuessResult = null;
      this.winningFaction = "AGENTS";
    } else {
      // Last Resort is OFF -> Loyal Agents win immediately
      this.awaitingLastResortGuess = false;
      this.chameleonGuessResult = null;
      this.winningFaction = "AGENTS";
    }

    room.broadcastState();
  }

  // Expected events:
  // LAST_RESORT_GUESS, RETURN_TO_LOBBY
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any,
  ): void {
    if (event === SocketEvent.LAST_RESORT_GUESS) {
      if (!this.awaitingLastResortGuess || player.role !== Role.CHAMELEON) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Last-resort guess is not available right now.",
        });
        return;
      }

      // Validate guess string
      const rawGuess =
        typeof payload?.guess === "string" ? payload.guess.trim() : "";
      if (!rawGuess) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Please enter a word guess.",
        });
        return;
      }

      // Check if it matches secret word
      const secret = (room.secretWord || "").trim().toLowerCase();
      const matched = secret.length > 0 && rawGuess.toLowerCase() === secret;

      this.chameleonGuessResult = matched;
      this.awaitingLastResortGuess = false;
      this.winningFaction = matched ? "CHAMELEON" : "AGENTS";

      room.broadcastState();
      return;
    }
    if (event === SocketEvent.RETURN_TO_LOBBY) {
      if (!player.isHost) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Only the host can return the room to the lobby.",
        });
        return;
      }
      this.transitionNext(room);
    } else {
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: "Invalid action received during the Game Over phase.",
      });
    }
  }

  public transitionNext(room: GameRoom): void {
    // Reset room round variables
    room.secretWord = null;
    room.activeCategory = undefined;
    room.clueMessages = [];
    room.chatTextMessages = [];

    // Reset player roles
    for (const p of room.players.values()) {
      p.role = Role.AGENT;
    }

    room.currentState = new LobbyState();
    room.broadcastState();
  }
}
