import { Player } from "../../models/Player";
import { GameRoom } from "../GameRoom";
import { GameState } from "./GameState";
import { CluePhaseState } from "./CluePhaseState";
import { SocketEvent, Role } from "../../models/types";

export class LobbyState extends GameState {
  public handleAction(
    room: GameRoom,
    player: Player,
    event: SocketEvent,
    payload: any
  ): void {
    // All lobby actions can only be done by host
    if (!player.isHost) {
      return;
    }
    // TODO: add other action handlers like for toggling categories or changing configuration.

    if (payload.action == SocketEvent.START_GAME) {
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
    this.assignChameleon(room);
    this.selectSecretWord(room);
    this.createPlayerOrder(room);
    let playerOrder = this.createPlayerOrder(room);

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
  private assignChameleon(room: GameRoom) : void
  {
    // Pick a random number from 0 to the number of players minus 1
    let chameleonIndex = Math.floor(Math.random() * room.players.size);

    // Iterate through all players, keeping track of a number i
    let i = 0;
    for(let [key, value] of room.players)
    {
      // When i is equal to chameleonIndex, assign that player the role.
      if(i == chameleonIndex)
      {
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
  private selectSecretWord(room: GameRoom) : void
  {
      let activeCategory : string[] = [];
      // Iterate through categories
      for(let category of room.categoryPool)
      {
        // Find the active category and assign it to the local list
        if(category.categoryName == room.activeCategory)
        {
          activeCategory = category.categories;
        }
      }
      // Throw exception if no active category is found
      if(activeCategory.length == 0)
      {
        throw new Error("Game Room's activeCategory is either undefined or does not match a category in categoryPool");
      }

      // Pick a random number and assign the word at that index in the category to the room's secret word
      let randomWordIndex = Math.floor(Math.random() * activeCategory.length);
      room.secretWord = activeCategory[randomWordIndex]!; // non-null assertion operator
  }


  /**
   * @author Alex
   * 
   * Creates a list of players in the lobby in a random order
   * 
   * @param room 
   * @returns 
   */
  private createPlayerOrder(room: GameRoom) : Player[]
  {
    let playerOrder : Player[] = [];
    // Iterate throguh the map and add all player objects in the room to a list
    for(let [key, value] of room.players)
    {
      playerOrder.push(value);
    }

    // Fisher-Yates Shuffle algorithm
    for(let i = playerOrder.length - 1; i >= 1; i--)
    {
      const j = Math.floor(Math.random() * (i + 1));
      [playerOrder[i], playerOrder[j]] = [playerOrder[j]!, playerOrder[i]!];
    }

    return playerOrder;
  }
}