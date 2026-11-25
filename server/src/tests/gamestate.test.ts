import { Role } from "../models/types";
import { Player } from "../models/Player";
import { GameRoom } from "../game/GameRoom";
import { GameState } from "../game/states/GameState";
import { LobbyState } from "../game/states/LobbyState";
import { CluePhaseState } from "../game/states/CluePhaseState";
import { Testing } from "./Testing";
import { CluesPhaseTest } from "./testing states/CluePhaseTest";
import { ClueMessage } from "../models/Message";
import { DiscussionState } from "../game/states/DiscussionState";
import { VotingState } from "../game/states/VotingState";
import { GameOverState } from "../game/states/GameOverState";
import { VotingTest } from "./testing states/VotingTest";
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
            for(let i = 0; i < Testing.numTests; i++)
            {
                const dummyRoom = Testing.createDummyRoom(4, () => {});

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
            }
        })

        describe("Clue State Tests", () => 
            {
                // Dummy Room for external tests
                const dummyRoom = Testing.createDummyRoom(4, () => {});
                dummyRoom.currentState.transitionNext(dummyRoom);

                describe("Clue State validateRound() Tests", () => 
                    {
                        // Fake players
                        let playerOne = new Player("Socket1", "Player 1");
                        let playerTwo = new Player("Socket2", "Player 2");
                        let playerThree = new Player("Socket3", "Player 3");
                        let playerFour = new Player("Socket4", "Player 4");

                        let defaultClue = new ClueMessage(playerOne, "message", 1);

                        let dummyCluePhase = new CluesPhaseTest([playerOne, playerTwo, playerThree, playerFour], 1); 

                        it("Phase has already ended, one round over limit", () => 
                        {
                            dummyCluePhase.setCurrentRound(2);
                            expect(() => 
                            {
                                dummyCluePhase.validateRound(dummyRoom, playerOne, new ClueMessage(playerOne, "Message", 3)); 
                            }).toThrow("The clue phase has already concluded.");
                        })
                        it("Phase already ended, many rounds over limit", () =>
                        {
                            dummyCluePhase.setCurrentRound(10);
                            expect(() =>
                            {
                                dummyCluePhase.validateRound(dummyRoom, playerOne, new ClueMessage(playerOne, "Message", 10));
                            }).toThrow("The clue phase has already concluded.");
                        })

                        dummyCluePhase.reset(); // Reset to default state

                        it("Clue submitted when currentTurnHolder is null throws error", () => 
                        {
                            dummyCluePhase.setCurrentTurnHolder(undefined);

                            expect(() =>
                            {
                                dummyCluePhase.validateRound(dummyRoom, playerOne, defaultClue);
                            }).toThrow();
                        })
                        it("Clue submitted when not player's turn throws error", () =>
                        {
                            dummyCluePhase.setCurrentTurnHolder(playerTwo);

                            expect(() =>
                            {
                                dummyCluePhase.validateRound(dummyRoom, playerOne, defaultClue);
                            }).toThrow();
                        })

                        it("Sending more than one clue message in the same round throws an error", () =>
                        {
                            dummyCluePhase.reset();
                            dummyCluePhase.addClue(defaultClue);
                            dummyRoom.clueMessages.push(defaultClue);
                            expect(() =>
                            {
                                dummyCluePhase.validateRound(dummyRoom, playerOne, defaultClue);
                            }).toThrow("You have already submitted your clue for this round.");
                        })

                        it("Sending an already submitted clue throws an error", () =>
                        {
                            dummyCluePhase.reset();

                            dummyCluePhase.addClue(defaultClue);
                            dummyRoom.clueMessages.push(defaultClue);

                            dummyCluePhase.setCurrentTurnHolder(playerTwo);

                            expect(() =>
                            {
                                dummyCluePhase.validateRound(dummyRoom, playerTwo, new ClueMessage(playerTwo, "Message", 1));
                            }).toThrow("This clue has already been used in this game. Please choose a unique word!");
                        })                       
                    })
                
                it("CluePhase state transition to Discussion State", () =>
                {
                    dummyRoom.currentState.transitionNext(dummyRoom);

                    expect(dummyRoom.currentState instanceof DiscussionState).toBe(true);
                })
                
            })

    describe("Discussion State Tests", () =>
    {
        let dummyRoom = Testing.createDummyRoom(4, () => {});
        dummyRoom.currentState.transitionNext(dummyRoom); // Lobby to Clue
        dummyRoom.currentState.transitionNext(dummyRoom); // Clue to Discussion

        it("Transition to Voting State", () =>
        {
            dummyRoom.currentState.transitionNext(dummyRoom);

            expect(dummyRoom.currentState instanceof VotingState).toBe(true);
        })
    })    

    describe("Voting State Tests", () =>
    {
        let dummyRoom = Testing.createDummyRoom(4, () => {});

        dummyRoom.currentState.transitionNext(dummyRoom); // Lobby to Clue
        dummyRoom.currentState.transitionNext(dummyRoom); // Clue to Discussion
        dummyRoom.currentState.transitionNext(dummyRoom); // Discussion to Voting

        it("Transition to Game Over State", () =>
        {
            dummyRoom.currentState.transitionNext(dummyRoom);

            expect(dummyRoom.currentState instanceof GameOverState).toBe(true);
        })

        let dummyVotingState = new VotingTest();

        it("processVotes() tests", () =>
        {
            
        })
    })

    describe("Game Over State Tests", () =>
    {
        let dummyRoom = Testing.createDummyRoom(4, () => {});

        dummyRoom.currentState.transitionNext(dummyRoom); // Lobby to Clue
        dummyRoom.currentState.transitionNext(dummyRoom); // Clue to Discussion
        dummyRoom.currentState.transitionNext(dummyRoom); // Discussion to Voting
        dummyRoom.currentState.transitionNext(dummyRoom); // Voting to GameOver
        it("Transition to Lobby State", () =>
        {
            expect(dummyRoom.currentState instanceof LobbyState).toBe(true);
        })
    })
})