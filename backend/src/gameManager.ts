import http from 'http';
import { Socket, Server as SocketServer } from 'socket.io';
import SocketEventHandler from './socketHandlers';
import { AIPlayerType, GameManagerType, GameType, ImageItem, PlayerType, socketEventHandlerType } from './types';
import {Result, MoveResult } from './sharedTypes'
import { v2 as cloudinary } from 'cloudinary';
import Player from './player';
import Game from './game';
import AIPlayer from './AIPlayer';

class GameManager implements GameManagerType{
    private static instance: GameManager;
    public io: SocketServer;
    private server: http.Server;
    private playersWaitList: PlayerType[];
    private games :GameType[];
    private cardImages: ImageItem[];
    private coverImages: ImageItem[];
    private gameStarted = new Map<GameType, boolean[]>();
    private socketEventHandler: socketEventHandlerType;
    private audios: Map<string, string>;


    //cards should be in a game not game manager

    private constructor(i_Server: http.Server) {
        // Initialize Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Create the HTTP server and Socket.IO server
        this.server = i_Server;
        this.io = new SocketServer(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL,
                methods: ["GET", "POST"]
            }
        });

        this.playersWaitList = [];
        this.games = [];
        this.cardImages = [];
        this.coverImages = [];
        this.gameStarted = new Map<GameType, boolean[]>();
        this.socketEventHandler = new SocketEventHandler(this.io);
        this.audios = new Map<string,string>();
       
        // Initialize the game
        this.initialize();

    }

    public static getInstance(server: http.Server): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager(server);
        }
        return GameManager.instance;
    }

    public start() {
        // Start the Socket.IO server
        const PORT = process.env.SOCKET_PORT || 7000;
        this.server.listen(PORT, () => {
            console.log(`Socket.IO server is running on port ${PORT}`);
        });
    }

    private async initialize() 
    {
         // Fetch images when server starts
         this.cardImages = await this.fetchImagesFromCloudinary('card_pokemon');
         this.coverImages = await this.fetchImagesFromCloudinary('cover_pokemon');
         this.audios = await this.featchAudios();

         // Initialize shutdown handlers
        await this.handleExit();

        this.io.on("connection", (socket) => {
            console.log(`New client connected: ${socket.id}`);
            this.socketEventHandler.listenToEvents(socket, this);          

            socket.on("disconnect", () => {
                console.log(`Client disconnected: ${socket.id}`);
                
                const game: GameType = this.games.filter(game => game.p1.id === socket.id || game.p2.id === socket.id)[0];
                if(game)
                {
                    // Handle player disconnection if needed
                    this.io.to(game.id).emit("opponentDisconnected", {i_Sound: this.audios.get('draw')});
                    this.gameStarted.delete(game);
                    this.games = this.games.filter(game => game.p1.id !== socket.id && game.p2.id !== socket.id);                
                }
                this.playersWaitList = this.playersWaitList.filter(player=> player.id !== socket.id);
                socket.removeAllListeners();
                //I should let the other palyer know that the game ended
            });
        });
    }

    public createPlayer(i_Name: string, i_Id:string)
    {
        if(this.IsPlayerExist(i_Id))
        {
            return;
        }

        let player: PlayerType = new Player(i_Name, i_Id);
        this.playersWaitList.push(player);
    }

    public createAIPlayer(i_Name: string)
    {
        let id: string = Math.floor(Math.random() * 1000).toString();

        while(this.IsPlayerExist(id))
        {
            id = Math.floor(Math.random() * 1000).toString();
        }

        let player: AIPlayerType = new AIPlayer(i_Name, id);
        this.playersWaitList.push(player);
    }

    public creatrGameAgainstAI(i_Socket: Socket)
    {
        this.createGame(i_Socket, this.playersWaitList[1], true);
    }

    public creatrGameOnline(i_Socket: Socket)
    {
        this.createGame(i_Socket, this.playersWaitList[1], false);
    }

    private createGame(i_Socket: Socket, i_Player: PlayerType | AIPlayerType, i_AIOponnent: boolean)
    {
        const p1 = this.playersWaitList[0];
        const id = this.playersWaitList[0].id + "-" + this.playersWaitList[1].id;
        const cards = this.setAndGetCardsGame(this.cardImages, this.coverImages);
        const AIOponnent: boolean = i_AIOponnent;

        const game: GameType = new Game(p1, i_Player, id, cards, AIOponnent, this.audios, this.onGameOver.bind(this));

        this.io.sockets.sockets.get(this.playersWaitList[0].id)?.join(game.id);
        i_Socket.join(game.id);

        this.games.push(game);
        this.gameStarted.set(game,[false, false]);
        this.playersWaitList.splice(0,2);
    }

    public findGameByPlayerId (i_id:string): GameType
    {
        const game =  this.games.find(game => game.p1.id == i_id || game.p2.id == i_id);
        if(game === undefined)
        {
            throw new Error("Something went wrong");
        }
        return game;
    }

    private IsPlayerExist (i_id:string): boolean
    {
        return this.playersWaitList.find(player => player.id == i_id) !== undefined;
    }

    public canCreateGame() : boolean
    {
        return this.playersWaitList.length >= 2;
    }

    private async featchAudios(): Promise<Map<string, string>>
    {
        const audioMap = new Map<string, string>();
        try
        {
            const audioNames: string[] = ['audio_effect_card_flipped', 'audio_effect_cards_match', 'audio_effect_player_lost',
                'audio_effect_player_won', 'audio_effect_unmatch_cards','audio_effect_start_game', 'audio_effect_draw'
            ];
            for (const audioName of audioNames) {
                const audioUrl = await this.fetchAudioFromCloudinary(audioName);
                const shortName = audioName.replace('audio_effect_','');
                audioMap.set(shortName, audioUrl);
            }            
            return audioMap;

        }
        catch(error)
        {
            throw new Error('Failed to get the images');
        }
    }

    private async fetchAudioFromCloudinary (i_prefix: string): Promise<string>
    {
        try
        {
            const audioResult = await cloudinary.api.resources({
                type: 'upload',
                prefix: i_prefix,
                resource_type: 'video', // Use 'video' for audio files
              });

              return audioResult.resources[0].secure_url;
        }
        catch(error)
        {
            throw new Error("Failed fetch audio from cloudinary");
        }
    }

    private async fetchImagesFromCloudinary (i_prefix: string): Promise<ImageItem[]>
    {
        try 
        {
            const cardImagesResult = await cloudinary.api.resources({
            type: 'upload',
            prefix: i_prefix,
            random: true,
            max_results: 1000
          });

          const cards = cardImagesResult.resources.map((cloudinaryImage:any) => ({id:  Number(cloudinaryImage.asset_id), src: cloudinaryImage.secure_url} as ImageItem));   
          return cards;       
        } 
        catch (error) 
        {
            throw new Error("Failed fetch images from cloudinary");
        }
    }

    private shuffleArray (i_ArrayToShuffle: any[]) : any[] 
    {
        return i_ArrayToShuffle
        .sort(() => Math.random() - 0.5)
        .map((item) => ({...item,id: Math.random()}))
    }

    private setAndGetCardsGame(i_CardImages: ImageItem[], i_CoverImages: ImageItem[])
    {
        //board size is nXn
        const boardSize: number = 4;
        const amountOfImagesForCards = ((boardSize*boardSize)/2);
        const imagesForCUrrentCardsGame = this.shuffleArray(i_CardImages).slice(0, amountOfImagesForCards);

        const randomNumber = Math.floor(Math.random() * i_CoverImages.length);
            
        let cards = imagesForCUrrentCardsGame.map((cloudinaryImage: ImageItem) => ({
            id: cloudinaryImage.id,
            coverImage:  i_CoverImages[randomNumber].src,
            uncoverImage:cloudinaryImage.src,
            covered: true
        }))
        const firstSet = cards.map(card => ({
            ...card,
            id: card.id+1
          }));

          const secondSet = cards.map(card => ({
            ...card,
            id: card.id+2
          }));

        cards = [...firstSet, ...secondSet];
        return this.shuffleArray(cards);
    }

    public initializeGameForUI(i_Socket: Socket) : { result: Result, game: GameType, eventToEmit: string }
    {
        let eventToEmit: string = "initializeGameForUI";
        const game = this.findGameByPlayerId(i_Socket.id);
        let ignoreEvent : string | undefined = undefined;
        const gameStartedForPlayers = this.gameStarted.get(game);

        if(gameStartedForPlayers)
        {
            const gameStartedForP1 = gameStartedForPlayers[0];
            const gameStartedForP2 = gameStartedForPlayers[1];
            
            if(game.p1.id === i_Socket.id)
            {
                if(gameStartedForP1)
                {
                    ignoreEvent = 'ignore';   
                }
                else
                {
                    gameStartedForPlayers[0] = true;
                }   
            }
            else if(game.p2.id === i_Socket.id)
            {
                if(gameStartedForP2)
                {
                    ignoreEvent = 'ignore';   
                }
                else
                {
                    gameStartedForPlayers[1] = true;   
                }
            }
            this.gameStarted.set(game, gameStartedForPlayers);            
        }

        const result = game.initializeGameForUI(i_Socket);        

        if (ignoreEvent !== undefined) {            
            eventToEmit = ignoreEvent;
        }

        return {result: result, game:game, eventToEmit: eventToEmit};
    }

    public move(i_Socket: Socket, i_CardId: number) : { moveResult: MoveResult, game: GameType, eventToEmitForCurrentPlayer: string, eventToEmitForSecondPlayer: string }
    {
        const eventToEmitForCurrentPlayer: string = "myMove";
        const eventToEmitForSecondPlayer: string = "opponentMove";
        const game = this.findGameByPlayerId(i_Socket.id);
        const moveResult = game.move(i_CardId);
        return {moveResult: moveResult, game: game, eventToEmitForCurrentPlayer: eventToEmitForCurrentPlayer, eventToEmitForSecondPlayer: eventToEmitForSecondPlayer};
    }

    public async AIMove(i_PlayerId: string): Promise<{endOfTurn: boolean, gameOver: boolean}>
    {
        const eventToEmitForCurrentPlayer: string = "myMove";
        const eventToEmitForSecondPlayer: string = "opponentMove";
        const game = this.findGameByPlayerId(i_PlayerId);
        const moveResult = game.AIMove();
        this.io.to(game.id).emit(eventToEmitForSecondPlayer, {audioUrl: moveResult.audioUrl, cards: moveResult.cards, currentPlayerTurn: !moveResult.currentPlayerTurn, disableBoard: moveResult.disableBoard, currentPlayerMovesCount: moveResult.currentPlayerMovesCount });

        return {endOfTurn: moveResult.cardsNotMatch, gameOver:game.gameIsOver}
    }

    public hideCards(i_Id: string): { hideCardsResult: MoveResult, game: GameType, eventToEmitForCurrentPlayer: string, eventToEmitForSecondPlayer: string }
    {
        const eventToEmitForCurrentPlayer: string = "hideCards";
        const eventToEmitForSecondPlayer: string = "hideCards";
        const game = this.findGameByPlayerId(i_Id);
        const hideCardsResult: MoveResult = game.hideCards(); 
        return {hideCardsResult: hideCardsResult, game: game, eventToEmitForCurrentPlayer:eventToEmitForCurrentPlayer, eventToEmitForSecondPlayer:eventToEmitForSecondPlayer};
    }

    public async serverDown() {
        // Inform the server that it is going down
        console.log('Server is shutting down...');

        // Disconnect all connected clients
        this.io.sockets.sockets.forEach((socket: Socket) => {
            console.log(`Disconnecting client: ${socket.id}`);
            socket.disconnect(true); // Immediately disconnect the client
        });
        this.gameStarted.clear();
        this.games.length = 0;

        // Close the server and stop accepting new connections
        this.server.close((err) => {
            if (err) {
                console.error('Error while closing server:', err);
            } else {
                console.log('Server closed successfully.');
            }
        });

        // Optionally wait for ongoing connections to close gracefully
        // This timeout is optional, adjust based on your use case
        setTimeout(() => {
            process.exit(0); // Exit the process after cleanup
        }, 1000); // 1 second timeout for all pending operations to finish
    }

    public getPlayersName(i_PlayerId: string)
    {
        const game = this.findGameByPlayerId(i_PlayerId);
        const gameStartedForPlayers = this.gameStarted.get(game);
        let eventToEmit = "setPlayersName";
        const thisPlayer = game.getPlayer(i_PlayerId);

        if(gameStartedForPlayers)
        {
            if((gameStartedForPlayers[0] && game.p1.id === i_PlayerId) ||
                (gameStartedForPlayers[1] && game.p2.id === i_PlayerId))
            {
                eventToEmit = 'ignore';
            }
        }

        const secondPlayer = game.p1.id === thisPlayer.id ? game.p2 : game.p1;

        return {
            myName: thisPlayer.name,
            opponentName: secondPlayer.name,
            eventToEmit: eventToEmit
        }
    }

    // Example usage of serverDown
    private handleExit() {
        process.on('SIGINT', () => this.serverDown());
        process.on('SIGTERM', () => this.serverDown());
        process.on('SIGUSR2', () => {
            console.log('Received SIGUSR2');
            this.serverDown();
        }); 
    }

    private onGameOver (i_GameId: string, i_Winner: PlayerType | undefined, i_Points: number, i_Moves: number)
    {
        //show toast of the winner
        //after 5 seconds redirect to landing page

        const eventToEmit = 'gameOver';
        const winingMessage = `
            Game Over!
            ${i_Winner ? `Winner: ${i_Winner.name}`: `It's a Draw`}
            Ponits: ${i_Points}
            number of moves: ${i_Moves}
        `;
        
        this.gameStarted.delete(this.games.filter(game => game.id === i_GameId)[0]);
        this.games = this.games.filter(game => game.id !== i_GameId);

        const winingAudio: string | undefined = this.audios.get('player_won');
        const losingAudio: string | undefined = this.audios.get('player_lost');
        const drawAudio: string | undefined = this.audios.get('draw');
        if(winingAudio === undefined || losingAudio === undefined || drawAudio === undefined)
        {
            throw new Error('No such audio');
        }
        const audios: string[] = [winingAudio, losingAudio, drawAudio];
        this.socketEventHandler.gameOver(i_GameId, eventToEmit, i_Winner? i_Winner.name: undefined, i_Points, i_Moves, audios);
    }

}

export default GameManager.getInstance;
