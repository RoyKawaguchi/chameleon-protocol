import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GamePhase } from "../../models/types";
import { CluePhaseState } from "./CluePhaseState";
import { SocketEvent, Role } from "../../models/types";

export class LobbyState extends GameState {
  constructor() {
    super();
    this.gamePhase = GamePhase.LOBBY;
  }

  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any
  ): void {
    if (!player.isHost) {
      return;
    }
    // TODO (Should): add other action handlers like for toggling categories or changing configuration.

    if (event == SocketEvent.START_GAME) {
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

    // ---Temporary Implementation---
    const secretWord = "lion";
    const category = "animals";
    const categoryWordList = "lion, dog, cat, mouse";

    const playerArray = Array.from(room.players.values());
    playerArray.forEach((player, index) => {
      // For now, assign chameleon to first player on list.
      const isChameleon = index === 0;
      player.role = isChameleon ? Role.CHAMELEON : Role.AGENT;

      const privatePayload = {
        role: player.role,
        secretWord: isChameleon ? null : secretWord,
        category: category,
        categoryWordList: categoryWordList,
      };
      room.sendPrivate(player.socketId, privatePayload);
    });

    room.currentState = new CluePhaseState(playerArray, 1);
    room.currentState.onEnter?.(room);
    // ---END---

    // TODO:
    // 1. Assign roles
    // 2. Randomly select secret word
    // 3. Establish random order and pass it to constructor of CluePhaseState

    // room.currentState = new CluePhaseState();
    // room.currentState.onEnter?.(room);
  }
}
