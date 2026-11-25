import { GameRoom } from "../../game/GameRoom";
import { VotingState } from "../../game/states/VotingState";
import { Player } from "../../models/Player";

export class VotingTest extends VotingState
{
    constructor()
    {
        super();
    }

    public reset() : void
    {
        this.votes = new Map();
        this.accusedPlayer = null;
        this.revoteActive = false;
        this.tiedPlayers = [];
    }

    public setVotes(votes : Map<string,string>)
    {
        this.votes = votes;
    }
    public getVotes() : Map<string,string>
    {
        return this.votes;
    }
    public addVote(voter : string, target : string)
    {
        this.votes.set(voter, target);
    }

    public setAccusedPlayer(player : Player | null)
    {
        this.accusedPlayer = player;
    }
    public getAccusedPlayer() : Player | null
    {
        return this.accusedPlayer;
    }

    public setRevote(isRevoteActive : boolean)
    {
        this.revoteActive = isRevoteActive;
    }
    public getRevote() : boolean
    {
        return this.revoteActive;
    }

    public setTiedPlayers(tiedPlayers : Array<{socketId: string; username: string}>)
    {
        this.tiedPlayers = tiedPlayers;
    }
    public getTiedPlayers() : Array<{socketId: string; username: string}>
    {
        return this.tiedPlayers;
    }
    public addTiedPlayers(tiedPlayers : {socketId: string; username: string})
    {
        this.tiedPlayers.push(tiedPlayers);
    }

    public processVotes(room: GameRoom): void
    {
        super.processVotes(room);
    }
    
}