import { ClueMessage } from "../models/Message"
import { Player } from "../models/Player"

describe("Chameleon Protocol - Model Tests", () =>
{
    describe("ClueMessage Tests", () =>
    {
        let player = new Player("Socket 1", "Player 1");

        it("Mesage that is zero characters throws an error", () =>
        {
            expect(() => 
            {
                let message = "";
                let clue = new ClueMessage(player, message, 1);
            }).toThrow();
        })
        it("Message that is barely too long throws an error", () =>
        {
            expect(() => 
            {
                let message = "thisis16characte"
                let clue = new ClueMessage(player, message, 1);
            }).toThrow("Clue must be between 1 and 15 characters long.");
        })
        it("Message that is way too long throws an error", () => 
        {
            expect(() => 
            {
                let message = "thisiswaylongerthan16characters";
                let clue = new ClueMessage(player, message, 1);
            }).toThrow("Clue must be between 1 and 15 characters long.");
        })
        it("Message that has spaces throws an error", () => 
        {
            expect(() => 
            {
                let message = "this has spaces";
                let clue = new ClueMessage(player, message, 1);
            }).toThrow("Clue must be a single word with no spaces.");
        })
        it("Message that contains punctuation throws an error", () =>
        {
            expect(() => 
            {
                let message = ",.!?/*";
                let clue = new ClueMessage(player, message, 1);
            }).toThrow("Clue cannot contain punctuation or special characters.");
        })
    })
})