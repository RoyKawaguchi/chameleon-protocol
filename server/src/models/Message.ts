// Defines the message hierarchy for player and system messages.
import { Player } from "./Player";

/**
 * Abstract superclass for all Message types.
 */
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
 * NOTE: not yet utilized in current implementation.
 */
export class SystemMessage extends Message {
  public constructor(content: string) {
    super(content);
  }
}

/**
 * Abstract class for a player message.
 * Inherited by ClueMessage and ChatTextMessage
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

  /**
   * Validates clue content to ensure it is not empty,
   * does not exceed 15 characters,
   * contains no spaces, and only uses letters and numbers.
   *
   * @param content - The clue text to validate.
   */
  private validateClueContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error("Clue cannot be empty.");
    }

    if (content.length > 15) {
      throw new Error("Clue must be 15 characters or fewer.");
    }

    if (/\s/.test(content)) {
      throw new Error("Clue must be a single word with no spaces.");
    }

    if (!/^[a-zA-Z0-9]+$/.test(content)) {
      throw new Error("Clue cannot contain punctuation or special characters.");
    }
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
