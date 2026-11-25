import { GameRoom } from "../../game/GameRoom";
import { CluePhaseState } from "../../game/states/CluePhaseState";
import { Player } from "../../models/Player";
import { ClueMessage } from "../../models/Message";

/**
 * @Author Alex
 * Subclass of CluePhaseState that adds some helper methods for testing purposes.
 */
export class CluesPhaseTest extends CluePhaseState
{
    constructor(playerOrder: readonly Player[], clueRoundLimit: number)
    {
        super(playerOrder, clueRoundLimit);
    }

    public reset() : void
    {
        this.currentRound = 1;
        this.currentTurnHolder = this.playerOrder[0];
        this.submittedClueTexts = new Set();
    }

    public setCurrentRound(currentRound : number)
    {
        this.currentRound = currentRound;
    }
    public getCurrentRound() : number
    {
        return this.currentRound;
    }

    public setCurrentTurnHolder(turnHolder: Player | undefined)
    {
        this.currentTurnHolder = turnHolder;
    }
    public getCurrentTurnHolder() : Player | undefined
    {
        return this.currentTurnHolder;
    }

    public getClueRoundLimit() : number
    {
        return this.clueRoundLimit;
    }

    public setSubmittedClueTexts(clueTexts : Set<string>)
    {
        this.submittedClueTexts = clueTexts;
    }
    public getSubmittedClueTexts() : Set<string>
    {
        return this.submittedClueTexts;
    }

    public addClue(clue: ClueMessage)
    {
        this.submittedClueTexts.add(clue.content);
    }

    public validateRound(room: GameRoom, player: Player, clueMsg: ClueMessage) : void
    {
        super.validateRound(room, player, clueMsg);
    }
}