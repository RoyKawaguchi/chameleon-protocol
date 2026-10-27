/**
 * Defines the message hierarchy for player and system messages.
 */
import { Player } from "./Player";

export abstract class Message {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly content: string;

  protected constructor(content: string) {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.content = content;
  }
}

/**
 * Concrete class for a system message.
 * For example, "System: Roy's turn to send his 1st clue!"
 */
export class SystemMessage extends Message {
  public constructor(content: string) {
    super(content);
  }
}

/**
 * Abstract class for a player message. Inherited by ClueMessage and ChatTextMessage
 */
export abstract class PlayerMessage extends Message {
  public readonly sender: Player;

  public constructor(sender: Player, content: string) {
    super(content);
    this.sender = sender;
  }
}

/**
 * Concrete class for a submitted single-word clue.
 */
export class ClueMessage extends PlayerMessage {
  public readonly roundNumber: number;

  constructor(sender: Player, content: string, roundNumber: number) {
    super(sender, content);
    this.validateClueContent(content);
    this.roundNumber = roundNumber;
  }

  private validateClueContent(content: string): void {
    // TODO:
    // Ensure clue is not too long (maybe max 15 chars?)
    // No space, punctuation, etc.
    // Throw an Error if any rule is broken. i.e., don't allow instantiation
  }
}

/**
 * Standard text message sent during DiscussionState open chat.
 */
export class ChatTextMessage extends PlayerMessage {
  constructor(sender: Player, content: string) {
    super(sender, content);
  }
}
