import { Socket } from "socket.io";
import { GameType, PlayerType, AIPlayerType } from "./types";
import {Result, MoveResult, CardType } from './sharedTypes'


class Game implements GameType {
    private m_p1: PlayerType;
    private m_p2: PlayerType | AIPlayerType;
    private m_id: string;
    private m_cards: CardType[];
    private m_chosenCards: CardType[];
    private m_GameOver: boolean;
    private m_AIOponnent: boolean;
    private onGameOver: (i_GameId: string, i_Winner: PlayerType | undefined, i_Points: number, i_Moves: number) => void;

    constructor(p1: PlayerType, p2: PlayerType | AIPlayerType, id: string, cards: CardType[], AIOponnent: boolean, onGameOver: (i_GameId: string, i_Winner: PlayerType | undefined, i_Points: number, i_Moves: number) => void) {
        this.m_p1 = p1;
        this.m_p2 = p2;
        this.m_id = id;
        this.m_cards = cards;
        this.m_chosenCards = [];
        this.m_p1.turn = true;
        this.onGameOver = onGameOver;
        this.m_GameOver = false;
        this.m_AIOponnent = AIOponnent;
    }

    private getCurrentPlayer(): PlayerType | AIPlayerType
    {
        return this.p1.turn ? this.p1 : this.p2;
    }

    public move(i_CardId: number) : MoveResult
    {        
        if (this.m_GameOver) {
            throw new Error("The game is over. No further moves are allowed.");
        }

        if(this.m_chosenCards.length > 1)
        {
            throw new Error("More than 2 cards were clicked");
        }

        const card: CardType | undefined = this.cards.find(card => card.id === i_CardId);

        if(card === undefined)
        {
            throw new Error("No card found");
        }
        if(!card.covered)
        {
            throw new Error("Card already been uncovered");
        }
        
        const player = this.getCurrentPlayer();
        player.increaseMovesCount(1);
        //add the cards to the cards the current player chose
        card.covered = false;
        this.m_chosenCards.push(card);

        const currentSocketTurn = player.turn;   
        let i_DisableBoard: boolean = false;
        const movesCount = player.MovesCount; 
        let cardsNotMatch: boolean = false;

        if(this.m_chosenCards.length == 2)
        {
            if(this.m_chosenCards[0].uncoverImage === this.m_chosenCards[1].uncoverImage)
            {
                this.m_chosenCards = [];
                this.playerGotPoint(player.id);
            }
            else
            {
                cardsNotMatch = true;           
                i_DisableBoard = true;
            }                
        }
    
        if(this.isGameOver())  {
            i_DisableBoard = true;
            setTimeout(() => {
                this.gameOver();
            }, 1000); // Delay game over by 2 seconds, but after returning the result
        }

        if(this.AIOponnent)
        {
            (this.m_p2 as AIPlayerType).cardToRemember(card);
        }

        const result : MoveResult = {
            cards: this.cards,
            currentPlayerTurn: currentSocketTurn,
            disableBoard: i_DisableBoard,
            cardsNotMatch: cardsNotMatch,
            currentPlayerMovesCount: movesCount,
        }
        return result;
    }

    public AIMove() : MoveResult
    {
        //--------------------------------------need to complete-------------------------------------
        if(this.m_AIOponnent)
        {
            if(this.m_p2.turn)
            {
                if (this.m_GameOver) {
                    throw new Error("The game is over. No further moves are allowed.");
                }
        
                if(this.m_chosenCards.length > 1)
                {
                    throw new Error("More than 2 cards were clicked");
                }
                
                const cardsCoveredStatusArray: boolean[] = this.cards.map((card)=>card.covered);
                let cardIndex: number = (this.m_p2 as AIPlayerType).move(this.m_cards);
                
                const moveResult:MoveResult = this.move(this.cards[cardIndex].id);
                // console.log(`game.ts - ai move
                //     cards not match = ${moveResult.cardsNotMatch}
                //     `)
                return moveResult
            }
            else{
                throw new Error("Not AI turn now");
            }
        }
        else{
            throw new Error("No AI Player");
        }
    }

    public hideCards() : MoveResult
    {
        if (this.m_GameOver) {
            throw new Error("The game is over. No further moves are allowed.");
        }

        if(this.m_chosenCards.length != 2)
        {
            throw new Error(`Something wrong with the hidden cards amount - ${this.hideCards.length}`)
        }
        this.m_chosenCards[0].covered = true;
        this.m_chosenCards[1].covered = true;
        this.m_chosenCards = [];
        const currentPlayer = this.p1.turn === true ? this.p1 : this.p2;
        this.switchTurns();
        const currentPlayerTurn = currentPlayer.turn;  
        const i_DisableBoard: boolean = false;
        const movesCount = currentPlayer.MovesCount;
        const cardsNotMatch: boolean = false;
        
        const result : MoveResult = {
            cards: this.cards,
            currentPlayerTurn: currentPlayerTurn,
            disableBoard: i_DisableBoard,
            cardsNotMatch: cardsNotMatch,
            currentPlayerMovesCount: movesCount
        }

        return result

    }

    private gameOver()
    {
        this.onGameOver(this.id, this.winner(), this.getMaxFinalPoints(), this.getMaxFinalMovesNumber());
    }

    private winner() : PlayerType | undefined
    {
        if(!this.m_GameOver)
        {
            throw new Error("The game is not over. can not declare winner.");
        }
        let winner : PlayerType | undefined;
        const draw = undefined;
        if(this.p1.points > this.p2.points)
        {
            winner = this.p1;
        }
        else if(this.p2.points > this.p1.points)
        {
            winner = this.p2;
        }
        else
        {
            winner = undefined;
        }

        return winner
    }

    private isGameOver()
    {
        this.m_GameOver = this.m_p1.points + this.m_p2.points == (this.cards.length / 2); 
        return this.m_GameOver;
    }

    private playerGotPoint(i_PlayerId: string)
    {
        this.getPlayer(i_PlayerId).increasePoints(1);
    }

    private switchTurns()
    {
        this.m_p1.turn = !this.m_p1.turn;
        this.m_p2.turn = !this.m_p2.turn;
    }

    public initializeGameForUI(i_Socket: Socket) : Result
    {
        if (this.m_GameOver) {
            throw new Error("The game is over. No further moves are allowed.");
        }

        const myTurn = this.isMyTurn(i_Socket.id);

        const result = {
            game: this,
            cards: this.cards,
            currentPlayerTurn: myTurn,
        }

        return result;
    }

    // Methods
    public getPlayer(i_Id: string): PlayerType {
        if (this.m_p1.id !== i_Id && this.m_p2.id !== i_Id) {
            throw new Error("No player with this id in the game");
        }
        return this.m_p1.id === i_Id ? this.m_p1 : this.m_p2;
    }

    public coverChosenCards(): void {
        if (this.m_GameOver) {
            throw new Error("The game is over. No further moves are allowed.");
        }

        this.m_chosenCards.map(card => card.covered = true);
        this.m_chosenCards = [];
    }

    private isMyTurn (i_Playerid: string)
    {
        const thisPlayer = this.getPlayer(i_Playerid);        
        return thisPlayer.turn;
    }

    private getMaxFinalPoints()
    {
        if(!this.gameOver)
        {
            throw new Error("Game has not ended");
        }
        return this.p1.points > this.p2.points ? this.p1.points : this.p2.points;
    }

    private getMaxFinalMovesNumber()
    {
        if(!this.gameOver)
        {
            throw new Error("Game has not ended yet");
        }
        return this.p1.MovesCount > this.p2.MovesCount ? this.p1.MovesCount : this.p2.MovesCount;
    }

    // Getters
    public get p1(): PlayerType {
        return this.m_p1;
    }

    public get p2(): PlayerType {
        return this.m_p2;
    }

    public get id(): string {
        return this.m_id;
    }

    public get cards(): CardType[] {
        return this.m_cards;
    }

    public get AIOponnent(): boolean {
        return this.m_AIOponnent;
    }

    public get gameIsOver(): boolean {
        return this.m_GameOver;
    }
}

export default Game;
