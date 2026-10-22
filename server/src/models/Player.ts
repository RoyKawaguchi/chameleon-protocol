/**
 * Player Model
 * Represents an individual connected participant in a game room.
 */
export enum Role {
  CHAMELEON = "CHAMELEON",
  AGENT = "AGENT",
  UNASSIGNED = "UNASSIGNED",
}

export class Player {
  public socketId: string;
  public username: string;
  public isHost: boolean;
  public role: Role;
  public score: number;

  constructor(socketId: string, username: string, isHost: boolean = false) {
    this.socketId = socketId;
    this.username = username;
    this.isHost = isHost;
    this.role = Role.UNASSIGNED;
    this.score = 0;
  }

  // Player functions go here
}
