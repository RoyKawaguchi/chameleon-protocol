import { GameRoom } from "../models/GameRoom";
import { Player, Role } from "../models/Player";

describe("Chameleon Protocol - GameRoom & Player Unit Tests", () => {
  it("should successfully create a room and add players", () => {
    const room = new GameRoom("ABC123");
    const host = new Player("socket_1", "Roy", true);
    const player2 = new Player("socket_2", "Teammate", false);

    room.addPlayer(host);
    room.addPlayer(player2);

    expect(room.roomId).toBe("ABC123");
    expect(room.players.size).toBe(2);
    expect(room.players.get("socket_1")?.isHost).toBe(true);
    expect(room.players.get("socket_2")?.username).toBe("Teammate");
  });

  it("should remove players correctly", () => {
    const room = new GameRoom("XYZ789");
    const player = new Player("socket_3", "Visitor", false);

    room.addPlayer(player);
    expect(room.players.size).toBe(1);

    room.removePlayer("socket_3");
    expect(room.players.size).toBe(0);
  });
});
