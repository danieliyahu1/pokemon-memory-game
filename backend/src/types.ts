import { Socket, Server as SocketServer } from 'socket.io';
import {Result, MoveResult } from './sharedTypes'


export type GameManagerType = {
    io: SocketServer;
    start(): void;
    createPlayer(i_Name: string, i_Id:string): void;
    createGame(i_Socket: Socket): void;
    canCreateGame() : boolean
    initializeGameForUI(i_Socket: Socket) : { result: Result, game: GameType, eventToEmit: string };
    getPlayersName(i_PlayerId: string) : {myName: string, opponentName: string, eventToEmit: string};
    move(i_Socket: Socket, i_CardId: number) : { moveResult: MoveResult, game: GameType, eventToEmitForCurrentPlayer: string, eventToEmitForSecondPlayer: string };
    hideCards(i_Socket: Socket): { hideCardsResult: MoveResult, game: GameType, eventToEmitForCurrentPlayer: string, eventToEmitForSecondPlayer: string };
    findGameByPlayerId (i_id:string): GameType;
};

export type socketEventHandlerType = {
    listenToEvents(socket: Socket, gameManager: GameManagerType): void;
    gameOver(room: string, eventToEmit: string, i_WinnerName: string | undefined, i_Points: number, i_Moves: number): void;
}

export type GameType = {
    getPlayer(i_Id : string) : PlayerType;
    coverChosenCards() : void;
    move(i_Socket: Socket, i_CardId: number): MoveResult;
    hideCards(i_Socket: Socket): MoveResult;
    initializeGameForUI(i_Socket: Socket, ) : Result;
    readonly p1: PlayerType;
    readonly p2: PlayerType;
    readonly id: string;
    readonly cards: CardType[];
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

export type ImageItem = {
    id: number;
    src: string;
};

export type CardType = {
    id: number;
    coverImage: string;
    uncoverImage: string;
    covered: boolean;
};

