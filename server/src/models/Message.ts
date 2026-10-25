/**
 * Defines the message hierarchy for player and system messages.
 */
import { Player } from "./Player";

export abstract class Message {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly content: string;

  protected constructor(id: string, content: string) {
    this.id = id;
    this.timestamp = Date.now();
    this.content = content;
  }
}

/**
 * Concrete class for a system message.
 * For example, "System: Roy's turn to send his 1st clue!"
 */
export class SystemMessage extends Message {
  public constructor(id: string, content: string) {
    super(id, content);
  }
}

/**
 * Abstract class for a player message. Inherited by ClueMessage and ChatTextMessage
 */
export abstract class PlayerMessage extends Message {
  public readonly sender: Player;
  public constructor(id: string, sender: Player, content: string) {
    super(id, content);
    this.sender = sender;
  }
}

/**
 * Concrete class for a submitted single-word clue.
 */
export class ClueMessage extends PlayerMessage {
  public readonly roundNumber: number;

  constructor(
    id: string,
    sender: Player,
    content: string,
    roundNumber: number
  ) {
    super(id, sender, content);
    this.validateClueContent(content);
    this.roundNumber = roundNumber;
  }

  private validateClueContent(content: string): void {
    // Ensure clue is not too long (maybe max 15 chars?)
    // No space, punctuation, etc.
    // Throw an Error if any rule is broken. i.e., don't allow instantiation
  }
}

/**
 * Standard text message sent during DiscussionState open chat.
 */
export class ChatTextMessage extends PlayerMessage {
  constructor(id: string, sender: Player, content: string) {
    super(id, sender, content);
  }
}
