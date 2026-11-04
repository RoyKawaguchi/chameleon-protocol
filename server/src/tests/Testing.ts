import { GameRoom } from "../game/GameRoom";
import { CluePhaseState } from "../game/states/CluePhaseState";
import { LobbyState } from "../game/states/LobbyState";
import { DiscussionState } from "../game/states/DiscussionState";
import { VotingState } from "../game/states/VotingState";
import { GameOverState } from "../game/states/GameOverState";
import { Player } from "../models/Player";
import { Role } from "../models/types";

/**
 *  @author Alex
 * 
 * A class containing static helper methods and variables for testing.
 */

export class Testing
{
    public static readonly numTests = 10; // Number of times tests will be run (For ones that test randomly generated functions)

    /**
     * @Author Alex
     * 
     * Creates a GameRoom object with a randomized ID populated with dummy player objects that have randomized socketIDs
     * 
     * @param numPlayers 
     * @returns A GameRoom Object initialized with dummy players equal to the numPlayers param
     */
    public static createDummyRoom(numPlayers : number) : GameRoom
    {
        const roomId = Math.floor(Math.random() * 9999); // Generate random room ID (Just number between 0 and 9999)
        const newRoom = new GameRoom(roomId.toString(), () => {});

        for(let i = 0; i < numPlayers; i++)
        {
            let name = "Player " + i.toString();
            let socketId = Math.floor(Math.random() * 999).toString();

            newRoom.addPlayer(socketId, name); // Add a new player with a random socket id and sequential player number to the room
        }

        return newRoom;
    }

    /**
     * @Author Alex
     * 
     *  Print function for debugging. Prints most relative info of the argument room object and info about the players in it.
     * 
     * @param room 
     */
    public static printRoomInfo(room: GameRoom) : void
    {
        console.log("Room ID: " + room.roomId);
        console.log("Active Category: " + room.activeCategory);
        console.log("Secret Word: " + room.secretWord);

        let stateInfo : String;
        {
            if(room.currentState instanceof LobbyState)
            {
                stateInfo = "LobbyState";
            }
            else if(room.currentState instanceof CluePhaseState)
            {
                stateInfo = "CluePhaseState";
            }
            else if(room.currentState instanceof DiscussionState)
            {
                stateInfo = "DiscussionState";
            }
            else if(room.currentState instanceof VotingState)
            {
                stateInfo = "VotingState";
            }
            else if(room.currentState instanceof GameOverState)
            {
                stateInfo = "GameOverState";
            }
            else
            {
                stateInfo = "Invalid State";
            }
        }
        console.log("Current State: " + stateInfo);

        // Print all player info
        console.log("Players:");
        for(let [socketId, player] of room.players)
        {
            console.log("   Username: " + player.username + "\n" +
                        "       Socket ID: " + socketId + "\n" +
                        "       Role: " + (player.role == Role.AGENT ? "AGENT" : "CHAMELEON") + "\n" +
                        "       Host Status: " + (player.isHost ? "True" : "False"));
        }
    }
}