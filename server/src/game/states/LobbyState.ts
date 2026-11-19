import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GamePhase, GameConfig } from "../../models/types";
import { CluePhaseState } from "./CluePhaseState";
import { SocketEvent, Role } from "../../models/types";

const ALLOWED_ROUNDS = new Set([1, 2]);
const ALLOWED_DISCUSSION_SECONDS = new Set([60, 90, 120]);

export class LobbyState extends GameState {
  constructor() {
    super();
    this.gamePhase = GamePhase.LOBBY;
  }

  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any,
  ): void {
    if (!player.isHost) {
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: "Only the host can perform lobby actions.",
      });
      return;
    }

    if (event === SocketEvent.UPDATE_CONFIG) {
      const incoming: Partial<GameConfig> | undefined =
        payload?.config ?? payload;
      if (!incoming || typeof incoming !== "object") {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Invalid configuration payload.",
        });
        return;
      }

      if (incoming.clueRounds !== undefined) {
        if (
          typeof incoming.clueRounds !== "number" ||
          !ALLOWED_ROUNDS.has(incoming.clueRounds)
        ) {
          room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
            message: "Invalid clue rounds setting.",
          });
          return;
        }
        room.config.clueRounds = incoming.clueRounds;
      }

      if (incoming.discussionTimeSeconds !== undefined) {
        if (
          typeof incoming.discussionTimeSeconds !== "number" ||
          !ALLOWED_DISCUSSION_SECONDS.has(incoming.discussionTimeSeconds)
        ) {
          room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
            message: "Invalid discussion time setting.",
          });
          return;
        }
        room.config.discussionTimeSeconds = incoming.discussionTimeSeconds;
      }

      if (incoming.chameleonLastResort !== undefined) {
        if (typeof incoming.chameleonLastResort !== "boolean") {
          room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
            message: "Invalid Chameleon Last Resort setting.",
          });
          return;
        }
        room.config.chameleonLastResort = incoming.chameleonLastResort;
      }

      room.broadcastState();
      return;
    }

    if (event === SocketEvent.START_GAME) {
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
    this.assignChameleon(room);
    this.selectSecretWord(room);
    const playerOrder = this.createPlayerOrder(room);

    room.broadcastState();

    for (const [socketID, player] of room.players) {
      const privatePayload =
        player.role === Role.CHAMELEON
          ? { role: player.role, secretWord: null }
          : { role: player.role, secretWord: room.secretWord };

      room.sendPrivate(socketID, SocketEvent.ROLE_ASSIGNED, privatePayload);
    }

    room.currentState = new CluePhaseState(playerOrder, room.config.clueRounds);
    room.currentState.onEnter?.(room);
  }

  /**
   * @author Alex
   *
   * Assign one random player in the room the role of Chameleon.
   *
   * @param room
   */
  private assignChameleon(room: GameRoom): void {
    // Pick a random number from 0 to the number of players minus 1
    let chameleonIndex = Math.floor(Math.random() * room.players.size);

    // Iterate through all players, keeping track of a number i
    let i = 0;
    for (let [key, value] of room.players) {
      // When i is equal to chameleonIndex, assign that player the role.
      if (i == chameleonIndex) {
        value.role = Role.CHAMELEON;
        break; // Break out of loop.
      }
      i++; // Add 1 to i every loop
    }
  }

  /**
   * @author Alex
   *
   * Select a word from the chosen category and assign it to the room's
   * secretWord variable.
   *
   * @param room
   */
  private selectSecretWord(room: GameRoom): void {
    // Throw an exception if there are no available categories
    if (room.categoryPool.length === 0) {
      throw new Error("Game Room has no available categories.");
    }

    // Randomly select a category from the category pool
    const randomCategoryIndex = Math.floor(
      Math.random() * room.categoryPool.length,
    );

    const selectedCategory = room.categoryPool[randomCategoryIndex]!;

    // Update the room's active category
    room.activeCategory = selectedCategory.categoryName;

    // Throw an exception if the selected category has no words
    if (selectedCategory.categories.length === 0) {
      throw new Error(
        `Selected category "${selectedCategory.categoryName}" has no words.`,
      );
    }

    // Randomly select a word from the selected category
    const randomWordIndex = Math.floor(
      Math.random() * selectedCategory.categories.length,
    );

    room.secretWord = selectedCategory.categories[randomWordIndex]!;
  }

  /**
   * @author Alex
   *
   * Creates a list of players in the lobby in a random order
   *
   * @param room
   * @returns
   */
  private createPlayerOrder(room: GameRoom): Player[] {
    let playerOrder: Player[] = [];
    // Iterate throguh the map and add all player objects in the room to a list
    for (let [key, value] of room.players) {
      playerOrder.push(value);
    }

    // Fisher-Yates Shuffle algorithm
    for (let i = playerOrder.length - 1; i >= 1; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerOrder[i], playerOrder[j]] = [playerOrder[j]!, playerOrder[i]!];
    }

    return playerOrder;
  }
}
