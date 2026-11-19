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
import { GamePhase, SocketEvent } from "../../models/types";
import { Role } from "../../models/types";

export class GameOverState extends GameState {
  private accusedPlayer: Player;
  private winningFaction: "AGENTS" | "CHAMELEON" = "AGENTS";
  private chameleonGuessResult: boolean | null = null;

  constructor(accusedPlayer: Player) {
    super();
    this.gamePhase = GamePhase.GAME_OVER;
    this.accusedPlayer = accusedPlayer;
  }

  public onEnter(room: GameRoom): void {
    if (this.accusedPlayer.role === Role.CHAMELEON) {
      // TODO (Should): Last-resort Chameleon guess
      this.winningFaction = "AGENTS";
    } else {
      this.winningFaction = "CHAMELEON";
    }
  }

  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any,
  ): void {
    // TODO (Should): handle Chameleon last-resort guessing action
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
