import { ServerUtil } from "../ServerUtil"
import { GameRoom } from "../game/GameRoom";
import { Player } from "../models/Player";

/**
 *  @Author Alex
 * 
 */
describe("Server Tests", () => 
{
    let serverUtil = new ServerUtil(() => {});

    describe("Test addNewRoom()", () =>
    {
        // Test that a new room is created in the activeRooms map when called
        let roomID = "000001";
        let pastRoomMapSize = serverUtil.getRoomMapSize();

        serverUtil.addNewRoom(roomID, new GameRoom(roomID, () => {})) // Empty payload function (irrelevant)

        it("Calling addNewRoom() adds a new key value pair to the map", () => 
        {
            expect(serverUtil.getRoomMapSize() > pastRoomMapSize).toBe(true); // Expect the count of active rooms to be one more after creating one room...
        })

        it("Trying to create a new room with an existing room ID throws and error", () =>
        {
            // Try to create a new gameroom with the same ID as the one above
            expect(() => 
            {
                    serverUtil.addNewRoom(roomID, new GameRoom(roomID, () => {}));
            }).toThrow();
        })
        
    })

    describe("Test isRoomActive", () => 
    {
        // Test that a known active room input returns true
        // Test that a known inactive room input returns false

        it("Test known active room check", () => 
        {
            expect(serverUtil.isRoomActive("000001")).toBe(true); // roomID created in previous test
        })
        it("Test known inactive room check", () => 
        {
            expect(serverUtil.isRoomActive("000002")).toBe(false); // Known inactive roomID
        })
    })

    it("Test registerSocket()", () => 
    {
        // Test that a new socket and room id is created in the socketToRoomMap

        let socketID = "Socket 1";
        let roomID = "000001";
        let pastSocketMapSize = serverUtil.getSocketMapSize();

        serverUtil.registerSocket(socketID, roomID);
        expect(serverUtil.getSocketMapSize() > pastSocketMapSize).toBe(true);
    })

    describe("Test getRoom()", () =>
    {
        it("Test known room returns a valid GameRoom object", () =>
        {
            // Known roomID created in previous test
            let result = serverUtil.getRoom("000001");
            expect(result instanceof GameRoom && result.roomId == "000001").toBe(true); // Also check that the returned GameRoom is the same ID
        })
        it("Test unknown room returns null", () =>
        {
            // Known uninitialized roomID
            expect(serverUtil.getRoom("000002") == null).toBe(true);
        })
    })

    describe("Test get RoomID", () => 
    {

        it("Test known socket returns valid roomID", () => 
        {
            // Known socket from previous test
            let result = serverUtil.getRoomID("Socket 1");
            expect(result != undefined).toBe(true);
        })
        it("Test unknown socket returns undefined", () => 
        {
            // Socket ID known to not exist in map
            let result = serverUtil.getRoomID("Socket 2")
            expect(result == undefined).toBe(true);
        })
    })

    describe("Test generateRoomCode()", () => 
    {

        for(let i = 0; i < 100; i++)
        {
            let roomID = serverUtil.generateRoomCode();
            let newRoom = new GameRoom(roomID, () => {});

            // If the roomID already exists, 
            serverUtil.addNewRoom(roomID, newRoom); // Create a new Room with generated roomID

            // This test will fail if it tries to make a new room with the same ID as another because addNewRoom() will throw an error.
            // The test passes if it creates all of these rooms without getting an error
        }

    })

    describe("Test getRoomAndPlayer()", () => 
    {
        let roomID = "roomID";
        let testRoom = new GameRoom(roomID, () => {});
        let socketID = "socketID";
        testRoom.addPlayer(socketID, "Username");

        let badSocketID = "wrong";

        serverUtil.addNewRoom(roomID, testRoom);
        serverUtil.registerSocket(socketID, roomID);

        // Test that a valid socket ID and room ID returns a player object and a gameroom object
        let result = serverUtil.getRoomAndPlayer(socketID);

        it("getRoomAndPlayer() returns a valid room and player object with valid input", () => 
        {
            expect(result[0] instanceof GameRoom).toBe(true);
            expect(result[0].roomId == roomID).toBe(true);
            expect(result[1] instanceof Player).toBe(true);
            expect(result[1].socketId == socketID).toBe(true);
        });
        // Test that an invalid socket ID throws an error
        it("getRoomAndPlayer() throws an error if socket ID is invalid", () =>
        {
            expect(() => 
            {
                serverUtil.getRoomAndPlayer(badSocketID);
            }).toThrow("Socket is not mapped to any room.");
        })
        // Test that a socket ID mapped to an invalid room throws an error
        it("getRoomAndPlayer() throws an error if it is mapped to an invalid room ID", () =>
        {
            serverUtil.registerSocket(badSocketID, "wrong");

            expect(() => 
            {
                serverUtil.getRoomAndPlayer(badSocketID);
            }).toThrow("Room not found in active registry.")
        });

        // Test that a valid socket ID but no matching player object throws an error
        it("getRoomAndPlayer() throws an error if a valid player object is missing from the target room", () =>
        {
            // Register the badSocketID to the room so it becomes valid, but don't give it a player object
            serverUtil.registerSocket(badSocketID, roomID);

            expect(() =>
            {
                serverUtil.getRoomAndPlayer(badSocketID);
            }).toThrow("Player not found in room.");
        });
        


    })

    describe("Test removePlayer()", () => 
    {
        // Fresh instance from other tests for easier examination
        let util = new ServerUtil(() => {});

        let socketOne = "Player 1";
        let socketTwo = "Player 2";
        let socketThree = "Player 3";
        let socketFour = "Player 4";
        let roomID = "room";

        let room = new GameRoom(roomID, () => {});
        util.addNewRoom(roomID, room);

        room.addPlayer(socketOne, "Host"); // Host
        util.registerSocket(socketOne, roomID);
        room.addPlayer(socketTwo, "Player 2");
        util.registerSocket(socketTwo, roomID);
        room.addPlayer(socketThree, "Player 3");
        util.registerSocket(socketThree, roomID);
        room.addPlayer(socketFour, "Player 3");
        util.registerSocket(socketFour, roomID);

        room.currentState.transitionNext(room);

        it("Player leaving mid-game closes the room", () => 
        {
            util.removePlayer(socketThree);
            expect(util.isRoomActive(roomID)).toBe(false);
        })

        // Test that a non registered socket properly returns without action
        it("Calling remove on an unregistered socket causes no action", () => 
        {
            util.removePlayer("unregistered");
        })

        // Test that removing a non-host player deletes the player object from the room

        it("Removing a player properly deletes them from the room", () => 
        {
            util.removePlayer(socketTwo);

            expect(room.getPlayerCount()).toBe(3); // Only the host should be left
        })

        // Test that removing a player and leaving the room empty deletes the room
        it("Removing last player in a room deletes the room", () =>
        {
            util.removePlayer(socketOne);

            expect(util.isRoomActive(roomID)).toBe(false);
        })
    })


})
