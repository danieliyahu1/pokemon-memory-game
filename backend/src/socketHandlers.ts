import { Socket, Server as socketServer } from 'socket.io';
import { GameManagerType } from './types';

class SocketEventHandler {
  private io: socketServer;

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  constructor(io: socketServer) {
    this.io = io;
  }

  public listenToEvents(socket: Socket, gameManager: GameManagerType) {
    socket.on("find", (data) => {
      gameManager.createPlayer(data.name, socket.id);
      if (gameManager.canCreateGame()) {
        gameManager.creatrGameOnline(socket);
        const game = gameManager.findGameByPlayerId(socket.id);
        this.io.in(game.id).emit("startGame");
      }
    });

    socket.on("playAlone", (data) => {
      gameManager.createPlayer(data.name, socket.id);
      gameManager.createAIPlayer("Sai");

      if (gameManager.canCreateGame()) {
        gameManager.creatrGameAgainstAI(socket);
        const game = gameManager.findGameByPlayerId(socket.id);
        this.io.in(game.id).emit("startGame");
      }
    });
    
    socket.on("initializeGameForUI", () => {
      const { result, game, eventToEmit } = gameManager.initializeGameForUI(socket);

      if (eventToEmit !== 'ignore') {
        socket.emit(eventToEmit, { audioUrl: result.audioUrl,cards: result.cards, currentPlayerTurn: result.currentPlayerTurn });

        if (game.AIOponnent && !result.currentPlayerTurn) {
          this.runAITurn(socket, gameManager, 1000);
        }
      }
    });

    socket.on("getPlayersName", () => {
      const { myName, opponentName, eventToEmit } = gameManager.getPlayersName(socket.id);
      socket.emit(eventToEmit, {
        i_MyName: myName,
        i_OpponentName: opponentName
      });
    });

    socket.on("move", (i_CardId) => {
      const { moveResult, game, eventToEmitForCurrentPlayer, eventToEmitForSecondPlayer} = gameManager.move(socket, i_CardId);
      socket.emit(eventToEmitForCurrentPlayer, {audioUrl: moveResult.audioUrl, cards: moveResult.cards, currentPlayerTurn: moveResult.currentPlayerTurn, disableBoard: moveResult.disableBoard, currentPlayerMovesCount: moveResult.currentPlayerMovesCount, currentPlayerPointsCount: moveResult.currentPlayerPointsCount });
      socket.broadcast.to(game.id).emit(eventToEmitForSecondPlayer, {audioUrl: moveResult.audioUrl, cards: moveResult.cards, currentPlayerTurn: !moveResult.currentPlayerTurn, disableBoard: moveResult.disableBoard, currentPlayerMovesCount: moveResult.currentPlayerMovesCount, currentPlayerPointsCount: moveResult.currentPlayerPointsCount });

      if (moveResult.cardsNotMatch) {
        setTimeout(() => {
            const { hideCardsResult, eventToEmitForCurrentPlayer, eventToEmitForSecondPlayer} = gameManager.hideCards(socket.id);
            socket.emit(eventToEmitForCurrentPlayer, {audioUrl: hideCardsResult.audioUrl, cards: hideCardsResult.cards, currentPlayerTurn: hideCardsResult.currentPlayerTurn, disableBoard: hideCardsResult.disableBoard, currentPlayerMovesCount: hideCardsResult.currentPlayerMovesCount, currentPlayerPointsCount: hideCardsResult.currentPlayerPointsCount });
            socket.broadcast.to(game.id).emit(eventToEmitForSecondPlayer, {audioUrl: hideCardsResult.audioUrl, cards: hideCardsResult.cards, currentPlayerTurn: !hideCardsResult.currentPlayerTurn, disableBoard: hideCardsResult.disableBoard, currentPlayerMovesCount: hideCardsResult.currentPlayerMovesCount, currentPlayerPointsCount: hideCardsResult.currentPlayerPointsCount });
            if (game.AIOponnent) {
              this.runAITurn(socket, gameManager, 2000);
            }
          }, 2000);
      }
    });

  }

  private runAITurn(socket: Socket, gameManager: GameManagerType, delayMs: number) {
    setTimeout(async () => {
      let endOfTurn = false;
      let gameOver = false;

      while (!gameOver && !endOfTurn) {
        const aiMoveResult = await gameManager.AIMove(socket.id);
        endOfTurn = aiMoveResult.endOfTurn;
        gameOver = aiMoveResult.gameOver;

        if (!gameOver && !endOfTurn) {
          await this.sleep(1000);
        }
      }

      if (!gameOver) {
        setTimeout(() => {
          const { hideCardsResult, eventToEmitForSecondPlayer } = gameManager.hideCards(socket.id);
          socket.emit(eventToEmitForSecondPlayer, {
            audioUrl: hideCardsResult.audioUrl,
            cards: hideCardsResult.cards,
            currentPlayerTurn: !hideCardsResult.currentPlayerTurn,
            disableBoard: hideCardsResult.disableBoard,
            currentPlayerMovesCount: hideCardsResult.currentPlayerMovesCount,
            currentPlayerPointsCount: hideCardsResult.currentPlayerPointsCount
          });
        }, 4000);
      }
    }, delayMs);
  }

  public gameOver(room: string, eventToEmit: string, i_WinnerName: string | undefined, i_Points: number, i_Moves: number, audios: string[]) {
    this.io.to(room).emit(eventToEmit, {i_WinnerName: i_WinnerName, i_Points: i_Points, i_Moves: i_Moves, i_Audios: audios});
  }
}

export default SocketEventHandler;
