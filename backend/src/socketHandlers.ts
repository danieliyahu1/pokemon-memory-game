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
      // Validate that authenticated users use their registered username
      if (socket.data.userId && socket.data.username) {
        if (data.name !== socket.data.username) {
          socket.emit("inviteError", { error: "Authenticated users must use their registered username" });
          return;
        }
      }
      
      gameManager.createPlayer(data.name, socket.id);
      if (gameManager.canCreateGame()) {
        gameManager.creatrGameOnline(socket);
        const game = gameManager.findGameByPlayerId(socket.id);
        this.io.in(game.id).emit("startGame");
      }
    });

    socket.on("playAlone", (data) => {
      // Validate that authenticated users use their registered username
      if (socket.data.userId && socket.data.username) {
        if (data.name !== socket.data.username) {
          socket.emit("inviteError", { error: "Authenticated users must use their registered username" });
          return;
        }
      }
      
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

    // New invite system events
    socket.on("sendGameInvite", (data: { toUserId: string; toUsername: string }) => {
      const fromUserId = socket.data.userId;
      const fromUsername = socket.data.username;

      if (!fromUserId || !fromUsername) {
        socket.emit("inviteError", { error: "You must be authenticated to send invites" });
        return;
      }

      const toSession = gameManager.playerSessionManager.getSession(data.toUserId);
      if (!toSession) {
        socket.emit("inviteError", { error: "User is not online" });
        return;
      }

      const inviteId = gameManager.inviteManager.sendInvite(
        fromUserId,
        fromUsername,
        data.toUserId,
        data.toUsername
      );

      // Send notification to recipient
      this.io.to(toSession.socketId).emit("gameInviteReceived", {
        inviteId,
        fromUsername,
        fromUserId,
      });

      // Confirm to sender
      socket.emit("inviteSent", { inviteId });
    });

    socket.on("acceptGameInvite", (data: { inviteId: string }) => {
      console.log(`Accept invite request: ${data.inviteId}`);
      
      const invite = gameManager.inviteManager.acceptInvite(data.inviteId);
      if (!invite) {
        console.error(`Invite not found: ${data.inviteId}`);
        socket.emit("inviteError", { error: "Invite not found" });
        return;
      }

      console.log(`Invite found: ${invite.fromUsername} -> ${invite.toUsername}`);
      
      // Look up current sessions for both users using their user IDs
      const fromSession = gameManager.playerSessionManager.getSession(invite.fromUserId);
      const toSession = gameManager.playerSessionManager.getSession(invite.toUserId);

      if (!fromSession || !toSession) {
        console.error(`One or both sessions not found. fromSession: ${fromSession ? 'found' : 'missing'}, toSession: ${toSession ? 'found' : 'missing'}`);
        socket.emit("inviteError", { error: "One of the players is no longer online" });
        return;
      }

      // Get the actual socket objects using the current socket IDs
      const socket1 = this.io.sockets.sockets.get(fromSession.socketId);
      const socket2 = this.io.sockets.sockets.get(toSession.socketId);

      if (!socket1 || !socket2) {
        console.error(`One or both sockets not found. socket1: ${socket1 ? 'found' : 'missing'}, socket2: ${socket2 ? 'found' : 'missing'}`);
        socket.emit("inviteError", { error: "One of the players is no longer online" });
        return;
      }

      // Create game from invite
      const game = gameManager.createGameFromInvite(
        socket1,
        invite.fromUsername,
        socket2,
        invite.toUsername
      );

      if (!game) {
        console.error("Failed to create game from invite");
        socket.emit("inviteError", { error: "Failed to create game" });
        return;
      }

      console.log(`Game created: ${game.id}, emitting startGame to both players`);
      // Notify both players that game is starting
      this.io.in(game.id).emit("startGame");

      // Remove the accepted invite
      gameManager.inviteManager.cancelInvite(data.inviteId);
    });

    socket.on("rejectGameInvite", (data: { inviteId: string }) => {
      const invite = gameManager.inviteManager.getInvite(data.inviteId);
      if (!invite) {
        socket.emit("inviteError", { error: "Invite not found" });
        return;
      }

      gameManager.inviteManager.rejectInvite(data.inviteId);

      // Notify sender that invite was rejected
      const fromSession = gameManager.playerSessionManager.getSession(invite.fromUserId);
      if (fromSession) {
        this.io.to(fromSession.socketId).emit("gameInviteRejected", {
          inviteId: data.inviteId,
          rejectingUsername: invite.toUsername,
        });
      }

      socket.emit("inviteRejected", { inviteId: data.inviteId });
    });

    socket.on("cancelGameInvite", (data: { inviteId: string }) => {
      const invite = gameManager.inviteManager.getInvite(data.inviteId);
      if (!invite) {
        socket.emit("inviteError", { error: "Invite not found" });
        return;
      }

      gameManager.inviteManager.cancelInvite(data.inviteId);

      // Notify recipient that invite was cancelled
      const toSession = gameManager.playerSessionManager.getSession(invite.toUserId);
      if (toSession) {
        this.io.to(toSession.socketId).emit("gameInviteCancelled", {
          inviteId: data.inviteId,
          cancellingUsername: invite.fromUsername,
        });
      }

      socket.emit("inviteCancelled", { inviteId: data.inviteId });
    });

    socket.on("getPendingInvites", () => {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("inviteError", { error: "You must be authenticated" });
        return;
      }

      const sentInvites = gameManager.inviteManager.getInvitesSentByUser(userId);
      const receivedInvites = gameManager.inviteManager.getInvitesReceivedByUser(userId);

      socket.emit("pendingInvites", {
        sent: sentInvites.map(invite => ({
          inviteId: invite.inviteId,
          toUsername: invite.toUsername,
          toUserId: invite.toUserId,
        })),
        received: receivedInvites.map(invite => ({
          inviteId: invite.inviteId,
          fromUsername: invite.fromUsername,
          fromUserId: invite.fromUserId,
        })),
      });
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
