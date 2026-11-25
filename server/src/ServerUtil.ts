import { GameRoom } from "./game/GameRoom";
import { Player } from "./models/Player";
import { GamePhase, SocketEvent } from "./models/types";

/**
 * @Author Alex
 * 
 * A class for containing the data and helper methods used by server.ts
 */
export class ServerUtil
{
    private activeRooms = new Map<string, GameRoom>();
    private socketToRoomMap = new Map<string, string>();
    private emit: (target: string, event: string, payload: any) => void;

    constructor(emit: (target: string, event: string, payload: any) => void){this.emit = emit;}

    public getRoomMapSize() : number
    {
        return this.activeRooms.size;
    }
    public getSocketMapSize() : number
    {
        return this.socketToRoomMap.size;
    }

    public addNewRoom(roomID : string, newRoom : GameRoom)
    {
        if(this.isRoomActive(roomID))
        {
            throw new Error("Room with that ID is already active!");
        }
        else
        {
            this.activeRooms.set(roomID, newRoom);
        }
    }
    private removeRoom(roomID: string)
    {
        this.activeRooms.delete(roomID);
    }

    public isRoomActive(roomID : string) : Boolean
    {
        return this.activeRooms.has(roomID);
    }

    public registerSocket(socketID : string, roomID : string)
    {
        this.socketToRoomMap.set(socketID, roomID);
    }
    private deregisterSocket(socketID : string)
    {
        this.socketToRoomMap.delete(socketID);
    }
    public getRoomIDFromSocket(socketID : string)
    {
        return this.socketToRoomMap.get(socketID);
    }

    public getRoom(roomID : string)
    {
        return this.activeRooms.get(roomID);
    }
    public getRoomID(socketID : string)
    {
        return this.socketToRoomMap.get(socketID);
    }

    /**
     * @Author Roy
     * 
     * 
     * 
     * @returns 6 character string to be used as a code for a room
     */
    public generateRoomCode(): string
    {
        // All possible characters that can be in a code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let code = "";

        // Generate a new code until an unused one is found
        do
        {
            for (let i = 0; i < 6; i++) // Generate 6 random characters from the string
            {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while(this.isRoomActive(code))
        return code; // Return code as string
    }

    /**
     * @Author Roy
     * 
     * @returns a tuple containing a GameRoom object and a Player object
     */
    public getRoomAndPlayer(socketID: string): [GameRoom, Player]
    {
        const roomID = this.getRoomID(socketID);

        if (!roomID)
        {
            throw new Error("Socket is not mapped to any room.");
        }
        const room = this.activeRooms.get(roomID);
        if (!room)
        {
            throw new Error("Room not found in active registry.");
        }
        const player = room.players.get(socketID);
        if(!player)
        {
            throw new Error("Player not found in room.");
        }
        return [room, player];
    }

    /**
     * @Author Roy, Alex
     * @param socketID Socket ID of disconnected player
     * 
     * @returns a tuple containing a boolean on if the game was stopped mid-match and an array of socketID keys of the remaining players
     */
    public removePlayer(socketID : string)
    {

        const roomID = this.getRoomID(socketID);
        if(!roomID) return; // No action needed if client was not mapped to a room

        // Remove the mapping from the socket to the room ID
        this.deregisterSocket(roomID);

        try
        {
            // Get the room object the player just left and the player object of that player
            const targetRoom = this.getRoom(roomID);
            const targetPlayer = targetRoom?.players.get(socketID);

            if (!targetRoom || !targetPlayer) return; // Verify the targets are not empty (keeps TypeScript happy)

            const wasInGame = targetRoom.currentState.gamePhase !== GamePhase.LOBBY;

            targetRoom?.removePlayer(socketID); // Delete the player object in the room

            // If the room is empty, delete it.
            if(targetRoom?.players.size == 0)
            {
                this.removeRoom(roomID);
                console.log(`[Room Cleaned] Room ${roomID} deleted as it is empty.`)
                return;
            }

            if (wasInGame)
            {
                this.emit(roomID, SocketEvent.PLAYER_DISCONNECTED, 
                    {
                        username: targetPlayer.username,
                        message: targetPlayer.username + ' disconnected mid-game. Please refresh the page to start a new game.',
                    }
                )
                for (const remainingSocketId of targetRoom.players.keys())
                {
                    this.deregisterSocket(remainingSocketId);
                }
                this.removeRoom(roomID);
            }

            // TODO: If the host is disconnected, assign host to the next available player
            if (targetPlayer.isHost && targetRoom.players.size > 0)
            {
                // Without this, if the host leaves the remaining players are soft-locked in the lobby.
                const nextHost = targetRoom.players.values().next().value;
                if(nextHost)
                {
                    nextHost.isHost = true;
                }
            }

            targetRoom.broadcastState(); // Send all clients the updated room information
            return;
        }
        catch(error)
        {
            console.error(`[Error] Failed handling disconnect for socket ${socketID}:`, error)
            return;
        }
    }
}