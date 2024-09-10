import { useEffect, useState } from "react"
import { useSocketContext } from "../contexts/SocketContext";
import Board from "../components/Board";
import {Result, MoveResult, CardType } from '../../../backend/src/sharedTypes';
import GameHeader from "../components/Header";
import {toast, ToastContainer, Zoom} from 'react-toastify';
import {PokemonMemoryPageProps} from '../App'
import 'react-toastify/dist/ReactToastify.css';

const GameScreen = ({ playerName: m_MyName, endPageFunction: gameOver }: PokemonMemoryPageProps) => {
    const [cards, setCards] = useState<CardType[]>([]);
    const [myTurn, setMyTurn] = useState<boolean>(false);
    const [disableBoard, setBoardDisable] = useState<boolean>(false);
    const [playerTurns, setPlayerTurns] = useState<number>(0);
    const [opponentTurns, setOpponentTurns] = useState<number>(0);
    const [opponentName, setOpponentName] = useState<string>("");
    const toastTimeOnScreen = 15000;
    const socketContext = useSocketContext();
    const socket = socketContext.socket;
    let currentAudio: HTMLAudioElement | null = null;


    useEffect(() => {       
    
        socket.emit('getPlayersName'); 
        socket.emit("initializeGameForUI");                           
        // Cleanup function to handle unmounting
        return () => {
                      
        };
    }, []);

    useEffect(() => {

        const playSound = (url: string) => {
            if(currentAudio)
            {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            currentAudio = new Audio(url);
            currentAudio.play();
        };

        const stopSound = () => {
            if (currentAudio) {
                currentAudio.pause();  // Stop the current audio
                currentAudio.currentTime = 0;  // Reset the audio to the start
            }
        };
        
        // Event listener for when opponent data is received
        const initializeGameForUI = ({audioUrl, cards, currentPlayerTurn: myTurn}: Result) => {
            playSound(audioUrl);
            setBoardDisable(true);   
            setCards(cards);       
            setMyTurn(myTurn);    
            setTimeout(() => {
                setBoardDisable(!myTurn);
            }, 800);            
        }   
         
        const setPlayersName = ({ i_OpponentName }: { i_MyName: string; i_OpponentName: string }) => {            
            setOpponentName(i_OpponentName);
        };  

        const myMove = ({audioUrl, cards, currentPlayerTurn: myTurn, disableBoard, currentPlayerMovesCount: myMovesCount }: MoveResult) => {  
            playSound(audioUrl);            
            setBoardDisable(true);
            setCards(cards);
            setTimeout(()=>{
                setMyTurn(myTurn);
                setBoardDisable(disableBoard);
                setPlayerTurns(myMovesCount);
            },500)
            
        }

        const opponentMove = ({audioUrl, cards, currentPlayerTurn: myTurn, disableBoard, currentPlayerMovesCount: opponentMovesCount}: MoveResult) => {  
            playSound(audioUrl);
            setCards(cards);
            setBoardDisable(true);
            setTimeout(()=>{
                setMyTurn(myTurn);
                setBoardDisable(disableBoard);
                setOpponentTurns(opponentMovesCount);
            },500)            
        }

        const handleHideCards = ({audioUrl, cards, currentPlayerTurn: myTurn, disableBoard }: MoveResult) => {
            playSound(audioUrl);
            setBoardDisable(true);
            setTimeout(()=>{
                setCards(cards);
                setMyTurn(myTurn);
            },300)         
            setTimeout(()=>{
                setBoardDisable(disableBoard);
            },800)
        };

        const handleGameOver = ({ i_WinnerName, i_Points, i_Moves, i_Audios }: { i_WinnerName: string | undefined , i_Points: number, i_Moves: number, i_Audios: string[] }) => 
        {        
                // Redirect to the landing page after 5 seconds
            let sound;
            if(i_WinnerName)
            {
                if(i_WinnerName === opponentName)
                {
                    sound = i_Audios[1];
                }
                else
                {
                    sound = i_Audios[0];
                }
            }
            else
            {
                sound = i_Audios[2];
            }
            const timeoutId = setTimeout(() => {  
                gameOver(m_MyName);                
            }, toastTimeOnScreen+1000);

            const handleStartNewGame = () => {
                clearTimeout(timeoutId);
                stopSound();
                gameOver(m_MyName);
            };

            const winingMessage = (
                <div className="text-center text-white">
                    <p className="font-bold">Game Ended!</p>
                    {i_WinnerName ? <p>Winner: {i_WinnerName}</p> : <p>It's a Draw</p>}
                    <p>Points: {i_Points}</p>
                    <p>Number of Moves: {i_Moves}</p>
                    <button
                        onClick={handleStartNewGame}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >Start New Game</button>
                </div>
            );

            playSound(sound);
            // Show a toast notification with the winner's name
            toast(winingMessage);
            setBoardDisable(true);
        };

        const handleOpponentDisconnected = ({i_Sound}: {i_Sound: string | undefined})=>{
            setBoardDisable(true);
            const timeoutId = setTimeout(() => {  
                gameOver(m_MyName);                
            }, toastTimeOnScreen+1000);

            const handleStartNewGame = () => {
                clearTimeout(timeoutId);
                stopSound();
                gameOver(m_MyName);
            };

            const toastMessage = (
                <div className="text-center text-white">
                    <p className="font-bold">Player forfited!</p>
                    <p className="font-bold">Let's play another game!</p>                    
                    <button
                        onClick={handleStartNewGame}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >Start New Game</button>
                </div>
            );            
            if(i_Sound)
            {
                playSound(i_Sound);
            }
            
            // Show a toast notification with the winner's name
            toast(toastMessage);
        }

        socket.on("initializeGameForUI", initializeGameForUI );
        socket.on('setPlayersName', setPlayersName)
        socket.on("myMove", myMove);
        socket.on("opponentMove", opponentMove);
        socket.on('hideCards', handleHideCards);
        socket.on('gameOver', handleGameOver);
        socket.on('opponentDisconnected', handleOpponentDisconnected);

        return () => {
            turnOffSocket();            
        };
        
      }, [socket, opponentName]);

    const handleMove = (i_CardId: number) => {
        socket.emit("move", i_CardId);
    }

    const turnOffSocket = () => 
    {
        socket.off("initializeGameForUI");
        socket.off('setPlayersName')
        socket.off("myMove");
        socket.off("opponentMove");
        socket.off('hideCards');
        socket.off('gameOver');
        socket.off('opponentDisconnected');        
    }

    return(
        <div className="flex flex-col h-screen">
            <GameHeader
                gameName="Pokemon Memory Game"
                opponentName={opponentName}
                myTurn={myTurn}
                playerTurns={playerTurns}
                opponentTurns={opponentTurns}
            />

            <ToastContainer                
                position="top-center"
                autoClose={toastTimeOnScreen}
                closeOnClick={false}
                pauseOnFocusLoss={false}
                pauseOnHover={false}
                theme="dark"
                transition= {Zoom}
                closeButton={false}
            />

            <div className="bg-gray-800 flex-grow flex items-center justify-center"
                style={{
                    cursor: (!myTurn || disableBoard) ? 'wait' : 'default',
                    pointerEvents: !myTurn || disableBoard ? 'none' : 'auto',    
                }}
            >
                {cards.length > 0 && <Board i_ButtonOnClick={myTurn && !disableBoard ? handleMove : undefined} i_Cards={cards}/>}
            </div>
        </div>
        
    )
}

export default GameScreen;