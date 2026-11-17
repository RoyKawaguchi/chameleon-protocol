import { GameRoom } from "./game/GameRoom";
import { Player } from "./models/Player";

/**
 * @Author Alex
 * 
 * A class for containing the data and helper methods used by server.ts
 */
export class ServerUtil
{
    private activeRooms = new Map<string, GameRoom>();
    private socketToRoomMap = new Map<string, string>();

    constructor(){}

    /**
     * @Author Alex
     * 
     * @param socketID string ID of the connected socket
     * @param roomID string ID of the new room
     * @param room the new GameRoom object
     * 
     * Adds a new GameRoom object to the registry
     */
    public addNewRoom(roomID : string, newRoom : GameRoom)
    {
        this.activeRooms.set(roomID, newRoom);
    }
    /**
     * @Author Alex
     * @param roomID ID of room to be deleted
     */
    private removeRoom(roomID: string)
    {
        this.activeRooms.delete(roomID);
    }
    /**
     * @Author Alex
     * @param roomID string ID of a room
     * @returns A boolean reperesenting whether a room with the input ID is active.
     */
    public isRoomActive(roomID : string) : Boolean
    {
        return this.activeRooms.has(roomID);
    }

    /**
     * @Author Alex
     * @param socketID Socket ID of a connected client
     * @param roomID string ID of a room
     * 
     * Registers the connected client's socket ID and room
     */
    public registerSocket(socketID : string, roomID : string)
    {
        this.socketToRoomMap.set(socketID, roomID);
    }
    /**
     * @Author Alex
     * @param socketID Target socket ID to be removed from the socket-to-room-ID map
     */
    private deregisterSocket(socketID : string)
    {
        this.socketToRoomMap.delete(socketID);
    }

    /**
     * @Author Alex
     * 
     * @param roomID Target room ID
     * @returns Either a GameRoom object or null depending on if the target room exists
     */
    public getRoom(roomID : string)
    {
        return this.activeRooms.get(roomID);
    }

    /**
     * @Author Alex
     * @param socketID Socket ID of the client connected to the room being searched for
     */
    public getRoomID(socketID : string)
    {
        return this.socketToRoomMap.get(socketID);
    }

    /**
     * @Author Roy
     * @returns 6 character string to be used as a code for a room
     */
    public generateRoomCode(): string
    {
        // All possible characters that can be in a code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        let code = "";
        for (let i = 0; i < 6; i++) // Generate 6 random characters from the string
        {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
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

            targetRoom?.removePlayer(socketID); // Delete the player object in the room

            // If the room is empty, delete it.
            if(targetRoom?.players.size == 0)
            {
                this.removeRoom(roomID);
                console.log(`[Room Cleaned] Room ${roomID} deleted as it is empty.`)
                return;
            }

            // TODO: If the host is disconnected, assign host to the next available player
            if (targetPlayer.isHost && targetRoom.players.size > 0)
            {
                // Without this, if the host leaves the remaining players are soft-locked in the lobby.
            }

            targetRoom.broadcastState(); // Send all clients the updated room information
        }
        catch(error)
        {
            console.error(`[Error] Failed handling disconnect for socket ${socketID}:`, error)
        }
    }
}