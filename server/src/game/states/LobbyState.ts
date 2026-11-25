import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { GamePhase, GameConfig } from "../../models/types";
import { CluePhaseState } from "./CluePhaseState";
import { SocketEvent, Role } from "../../models/types";

// Lobby config
const ALLOWED_ROUNDS = new Set([1, 2]);
const ALLOWED_DISCUSSION_SECONDS = new Set([60, 90, 120]);

/**
 * Concrete class representing the lobby game state.
 * Previous state: GameOverState, Next state: CluePhaseState.
 */
export class LobbyState extends GameState {
  /**
   * Constructor of LobbyState.
   */
  constructor() {
    super();
    this.gamePhase = GamePhase.LOBBY;
  }

  // Expected events:
  // UPDATE_CONFIG, TOGGLE_CATEGORY, TOGGLE_CATEGORY_ITEM, SAVE_CUSTOM_CATEGORY, or START_GAME
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any,
  ): void {
    // Reject non-host
    if (!player.isHost) {
      room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
        message: "Only the host can perform lobby actions.",
      });
      return;
    }

    // 1. UPDATE_CONFIG
    if (event === SocketEvent.UPDATE_CONFIG) {
      // Get configuration from payload
      const incoming: Partial<GameConfig> | undefined =
        payload?.config ?? payload;

      // Reject invalid config payload
      if (!incoming || typeof incoming !== "object") {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Invalid configuration payload.",
        });
        return;
      }

      // Validate and update number of clue rounds
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

      // Validate and update discussion time
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

      // Validate and update the Chameleon Last Resort setting
      if (incoming.chameleonLastResort !== undefined) {
        if (typeof incoming.chameleonLastResort !== "boolean") {
          room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
            message: "Invalid Chameleon Last Resort setting.",
          });
          return;
        }
        room.config.chameleonLastResort = incoming.chameleonLastResort;
      }

      // Broadcast the updated room state
      room.broadcastState();
      return;
    }

    // 2. TOGGLE_CATEGORY
    if (event === SocketEvent.TOGGLE_CATEGORY) {
      // Validate the category ID
      if (!payload || typeof payload.categoryId !== "string") {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Invalid category toggle payload.",
        });
        return;
      }

      // Toggle the selected category
      const updated = room.toggleCategory(payload.categoryId);

      // Reject if the category does not exist
      if (!updated) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Category not found.",
        });
        return;
      }

      // Broadcast the updated room state
      room.broadcastState();
      return;
    }

    // 3. TOGGLE_CATEGORY_ITEM
    if (event === SocketEvent.TOGGLE_CATEGORY_ITEM) {
      // Validate the category and item IDs
      if (
        !payload ||
        typeof payload.categoryId !== "string" ||
        typeof payload.itemId !== "string"
      ) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Invalid category item toggle payload.",
        });
        return;
      }

      // Toggle the selected category item
      const updated = room.toggleCategoryItem(
        payload.categoryId,
        payload.itemId,
      );

      // Reject if the category or item does not exist
      if (!updated) {
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message: "Category or item not found.",
        });
        return;
      }

      // Broadcast the updated room state
      room.broadcastState();
      return;
    }

    // 4. SAVE_CUSTOM_CATEGORY
    if (event === SocketEvent.SAVE_CUSTOM_CATEGORY) {
      try {
        // Get the category name from the payload
        const categoryName =
          typeof payload?.categoryName === "string" ? payload.categoryName : "";

        // Get the words from the payload
        const words = Array.isArray(payload?.words)
          ? payload.words
          : typeof payload?.wordsText === "string"
            ? payload.wordsText.split(",")
            : [];

        // Save the custom category and broadcast the updated room state
        room.saveCustomCategory(categoryName, words);
        room.broadcastState();
      } catch (error) {
        // Send an error message if saving the category fails
        room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
          message:
            error instanceof Error
              ? error.message
              : "Failed to save custom category.",
        });
      }
      return;
    }

    // 5. START_GAME
    if (event === SocketEvent.START_GAME) {
      this.transitionNext(room);
    }

    // Invalid action
    room.sendPrivate(player.socketId, SocketEvent.ERROR_MESSAGE, {
      message: "Invalid action received during the Lobby Phase.",
    });
  }

  /**
   * Transition to CluePhaseState. Initializes the game.
   * @param room GameRoom object
   */
  public transitionNext(room: GameRoom): void {
    if (room.players.size < 4) {
      throw new Error("Cannot start game with fewer than 4 players.");
    }
    this.assignChameleon(room);
    this.selectSecretWord(room);
    const playerOrder = this.createPlayerOrder(room);

    // Update to next state
    room.currentState = new CluePhaseState(playerOrder, room.config.clueRounds);

    // Send each player their role and secret word (if AGENT)
    for (const [socketID, player] of room.players) {
      const privatePayload =
        player.role === Role.CHAMELEON
          ? { role: player.role, secretWord: null }
          : { role: player.role, secretWord: room.secretWord };

      room.sendPrivate(socketID, SocketEvent.ROLE_ASSIGNED, privatePayload);
    }

    room.currentState.onEnter?.(room);
  }

  /**
   * @author Alex
   * Assign one random player in the room the role of Chameleon.
   * @param room GameRoom object
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
   * Select a word from the chosen category and assign it to the room's
   * secretWord variable.
   * @param room GameRoom object
   */
  private selectSecretWord(room: GameRoom): void {
    // Filter to enabled categories that have at least one enabled item
    const eligibleCategories = room.categoryPool.filter(
      (cat) => cat.enabled && cat.items.some((item) => item.enabled),
    );

    if (eligibleCategories.length === 0) {
      throw new Error("Game Room has no enabled categories with active words.");
    }

    // Randomly select a category from the eligible categories
    const randomCategoryIndex = Math.floor(
      Math.random() * eligibleCategories.length,
    );

    const selectedCategory = eligibleCategories[randomCategoryIndex]!;

    // Update the room's active category
    room.activeCategory = selectedCategory.categoryName;

    const enabledItems = selectedCategory.items.filter((item) => item.enabled);

    // Randomly select a word from the enabled items in the selected category
    const randomWordIndex = Math.floor(Math.random() * enabledItems.length);

    room.secretWord = enabledItems[randomWordIndex]!.word;
  }

  /**
   * @author Alex
   * Creates a list of players in the lobby in a random order
   * @param room GameRoom object
   * @returns the array of Player objects in the random order
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
