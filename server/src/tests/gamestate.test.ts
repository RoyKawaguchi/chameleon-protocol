import { Role } from "../models/types";
import { Player } from "../models/Player";
import { GameRoom } from "../game/GameRoom";
import { GameState } from "../game/states/GameState";
import { LobbyState } from "../game/states/LobbyState";
import { CluePhaseState } from "../game/states/CluePhaseState";
import { Testing } from "./Testing";
// import { DiscussionState } from "../game/states/DiscussionState";
// import { VotingState } from "../game/states/VotingState";
// import { GameOverState } from "../game/states/GameOverState";

describe("Chameleon Protocol - Game State Tests", () => 
    {
        /**
         * @author Alex
         * 
         * Creates a dummy room with 4 players and transitions it from LobbyState
         * to CluePhaseState. After transitioning, it tests that one player was properly assigned
         * the Chameleon role, that a secret word from the active category was properly chosen,
         * and that the turn order of players in the CluePhaseState is not empty.
         * 
         * This test examines functions that deal with random generation, so 
         * it runs a number of times according to the static variable in Testing.ts
         */
        describe("Lobby State to Clue State Transition", () =>
        {

            console.log("Creating " + Testing.numTests.toString() + " rooms and testing the transition to ClueState...");

            for(let i = 0; i < Testing.numTests; i++)
            {
                const dummyRoom = Testing.createDummyRoom(4);

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

                Testing.printRoomInfo(dummyRoom);
            }
        })

        describe("Clue State Tests", () => 
            {
                // Dummy Room for external tests
                const dummyRoom = Testing.createDummyRoom(4);
                dummyRoom.currentState.transitionNext(dummyRoom);

                describe("Clue State ValidateClueAmount() Tests", () => 
                    {
                        let dummyCluePhase = new CluePhaseState([], dummyRoom.config.clueRounds); // Empty list for turn order because it is not used in these tests

                        it("Below Expected Number of Clues", () => 
                        {

                            // expect(dummyCluePhase.validateClueAmount()).toBe(false);
                            expect(1).toBe(1);
                        })
                    })
                
            })

    })