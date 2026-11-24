/**
 * Evaluates match resolution:
 * - Handles the Chameleon's last-resort word guess if enabled.
 * - Assembles the post-game summary audit log.
 * - Allows the host to reset and return the group to the lobby.
 */

import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { LobbyState } from "./LobbyState";
import { GamePhase, SocketEvent, Role } from "../../models/types";

export class GameOverState extends GameState {
  private accusedPlayer: Player;
  private winningFaction: "AGENTS" | "CHAMELEON" = "AGENTS";
  private chameleonGuessResult: boolean | null = null;
  private awaitingLastResortGuess: boolean = false;

  constructor(accusedPlayer: Player) {
    super();
    this.gamePhase = GamePhase.GAME_OVER;
    this.accusedPlayer = accusedPlayer;
  }

  // Getters for broadcastState() in GameRoom
  public getAccusedPlayer(): Player {
    return this.accusedPlayer;
  }

  public getWinningFaction(): "AGENTS" | "CHAMELEON" {
    return this.winningFaction;
  }

  public getChameleonGuessResult(): boolean | null {
    return this.chameleonGuessResult;
  }

  public isAwaitingLastResortGuess(): boolean {
    return this.awaitingLastResortGuess;
  }

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

      const rawGuess =
        typeof payload?.guess === "string" ? payload.guess.trim() : "";
      if (!rawGuess) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Please enter a word guess.",
        });
        return;
      }

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
