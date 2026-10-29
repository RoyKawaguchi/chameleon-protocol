import { Role } from "../models/types";
import { Player } from "../models/Player";
import { GameRoom } from "../game/GameRoom";
import { GameState } from "../game/states/GameState";
import { LobbyState } from "../game/states/LobbyState";
import { CluePhaseState } from "../game/states/CluePhaseState";
// import { DiscussionState } from "../game/states/DiscussionState";
// import { VotingState } from "../game/states/VotingState";
// import { GameOverState } from "../game/states/GameOverState";

describe("Chameleon Protocol - Game State Tests", () => 
    {
        describe("Lobby State to Clue State Transition", () =>
        {
            const roomId = "123456";
            const dummyRoom = new GameRoom(roomId, () => {});

            dummyRoom.addPlayer("0", "PlayerA");
            dummyRoom.addPlayer("1", "PlayerB");
            dummyRoom.addPlayer("2", "PlayerC");
            dummyRoom.addPlayer("3", "PlayerD");

            // Transition to CluePhaseState
            dummyRoom.currentState.transitionNext(dummyRoom);

            it("Is Game Room In Clue State", () => 
                {
                    // Test fails if the current state of the game room is not CluePhaseState
                    expect(dummyRoom.currentState instanceof CluePhaseState).toBe(true);
                })

            it("is Random Word Chosen", () => 
                {
                    // Test fails if the random word is null
                    expect(dummyRoom.secretWord != null).toBe(true);
                    // TODO: Test if the secret word is in the selected category (idk how the category object works)
                })
            
            it("Is One (and only one) Player a chameleon?", () =>
                {
                    let numChameleon = 0;

                    for(let [key, value] of dummyRoom.players)
                    {
                        if (value.role == Role.CHAMELEON)
                        {
                            numChameleon++;
                        }
                    }

                    expect(numChameleon).toBe(1);
                })
        })

    })

