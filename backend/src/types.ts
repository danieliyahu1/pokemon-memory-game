import { Socket, Server as SocketServer } from 'socket.io';
import {Result, MoveResult, CardType } from './sharedTypes';


export type GameManagerType = {
    io: SocketServer;
    start(): void;
    createPlayer(i_Name: string, i_Id:string): void;
    createAIPlayer(i_Name: string): void;
    creatrGameOnline(i_Socket: Socket): void;
    creatrGameAgainstAI(i_Socket: Socket): void;
    canCreateGame() : boolean
    initializeGameForUI(i_Socket: Socket) : { result: Result, game: GameType, eventToEmit: string };
    getPlayersName(i_PlayerId: string) : {myName: string, opponentName: string, eventToEmit: string};
    move(i_Socket: Socket, i_CardId: number) : { moveResult: MoveResult, game: GameType, eventToEmitForCurrentPlayer: string, eventToEmitForSecondPlayer: string };
    AIMove(i_PlayerId: string): {endOfTurn:boolean, gameOver:boolean};
    hideCards(i_Id: string): { hideCardsResult: MoveResult, game: GameType, eventToEmitForCurrentPlayer: string, eventToEmitForSecondPlayer: string };
    findGameByPlayerId (i_id:string): GameType;
};

export type socketEventHandlerType = {
    listenToEvents(socket: Socket, gameManager: GameManagerType): void;
    gameOver(room: string, eventToEmit: string, i_WinnerName: string | undefined, i_Points: number, i_Moves: number): void;
}

export type GameType = {
    getPlayer(i_Id : string) : PlayerType;
    coverChosenCards() : void;
    move(i_CardId: number): MoveResult;
    hideCards(): MoveResult;
    initializeGameForUI(i_Socket: Socket, ) : Result;
    AIMove() : MoveResult;
    readonly p1: PlayerType;
    readonly p2: PlayerType;
    readonly id: string;
    readonly cards: CardType[];
    readonly AIOponnent: boolean;
    readonly gameIsOver: boolean;
}

export type PlayerType = {
    readonly name: string;
    readonly cardsChosen: number[];
    readonly MovesCount: number;
    readonly points: number;
    readonly cardsUncover: number[];
    readonly id: string;
    turn: boolean;
    increasePoints(i_NumToIncrease: number): void;
    increaseMovesCount(i_NumToIncrease: number): void;
}

export type AIPlayerType = PlayerType & {
    move(i_Cards: CardType[]): number;  // Add a method specifically for the computer player's move
    cardToRemember(i_Card: CardType): void;
};

export type ImageItem = {
    id: number;
    src: string;
};



