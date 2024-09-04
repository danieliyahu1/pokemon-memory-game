import { Socket, Server as socketServer } from 'socket.io';
import { GameManagerType } from './types';

class SocketEventHandler {
  private io: socketServer;

  constructor(io: socketServer) {
    this.io = io;
  }

  public listenToEvents(socket: Socket, gameManager: GameManagerType) {
    socket.on("find", (data) => {
      gameManager.createPlayer(data.name, socket.id);

      if (gameManager.canCreateGame()) {
        gameManager.createGame(socket);
        const game = gameManager.findGameByPlayerId(socket.id);
        this.io.in(game.id).emit("startGame");
      }
    });

    socket.on("initializeGameForUI", () => {
      const { result, game, eventToEmit } = gameManager.initializeGameForUI(socket);

      if (eventToEmit !== 'ignore') {
        socket.emit(eventToEmit, { cards: result.cards, currentPlayerTurn: result.currentPlayerTurn });
      }
    });

    socket.on("getPlayersName", () => {
      const { myName, opponentName, eventToEmit } = gameManager.getPlayersName(socket.id);
      socket.emit(eventToEmit, {
        myName: myName,
        opponentName: opponentName
      });
    });

    socket.on("move", (i_CardId) => {
      const { moveResult, game, eventToEmitForCurrentPlayer, eventToEmitForSecondPlayer} = gameManager.move(socket, i_CardId);
      socket.emit(eventToEmitForCurrentPlayer, { cards: moveResult.cards, currentPlayerTurn: moveResult.currentPlayerTurn, disableBoard: moveResult.disableBoard, currentPlayerMovesCount: moveResult.currentPlayerMovesCount });
      socket.broadcast.to(game.id).emit(eventToEmitForSecondPlayer, { cards: moveResult.cards, currentPlayerTurn: !moveResult.currentPlayerTurn, disableBoard: moveResult.disableBoard, currentPlayerMovesCount: moveResult.currentPlayerMovesCount });

      if (moveResult.cardsNotMatch) {
        setTimeout(() => {
            const { hideCardsResult, eventToEmitForCurrentPlayer, eventToEmitForSecondPlayer} = gameManager.hideCards(socket);
            socket.emit(eventToEmitForCurrentPlayer, { cards: hideCardsResult.cards, currentPlayerTurn: hideCardsResult.currentPlayerTurn, disableBoard: hideCardsResult.disableBoard, currentPlayerMovesCount: hideCardsResult.currentPlayerMovesCount });
            socket.broadcast.to(game.id).emit(eventToEmitForSecondPlayer, { cards: hideCardsResult.cards, currentPlayerTurn: !hideCardsResult.currentPlayerTurn, disableBoard: hideCardsResult.disableBoard, currentPlayerMovesCount: hideCardsResult.currentPlayerMovesCount });
        }, 2000);
      }
    });
  }

  public gameOver(room: string, eventToEmit: string, i_WinnerName: string | undefined, i_Points: number, i_Moves: number) {
    this.io.to(room).emit(eventToEmit, {i_WinnerName: i_WinnerName, i_Points: i_Points, i_Moves: i_Moves});
  }
}

export default SocketEventHandler;