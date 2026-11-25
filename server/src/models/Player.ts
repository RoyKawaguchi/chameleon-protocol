import { Role } from "./types";

/**
 * Represents an individual participant in a GameRoom.
 */
export class Player {
  public readonly socketId: string;
  public readonly username: string;
  public isHost: boolean;
  public role: Role;

  constructor(socketId: string, username: string, isHost: boolean = false) {
    this.socketId = socketId;
    this.username = username;
    this.isHost = isHost;
    this.role = Role.AGENT; // Defaults to AGENT until assigned by game start
  }
}
