import { useEffect, useState } from "react"
import { useSocketContext } from "../contexts/SocketContext";
import { CardType } from '../../../backend/src/types'
import Board from "../components/Board";
import {Result, MoveResult } from '../../../backend/src/sharedTypes';
import GameHeader from "../components/Header";
import {toast, ToastContainer, Zoom} from 'react-toastify';
import {PokemonMemoryPageProps} from '../App'
import 'react-toastify/dist/ReactToastify.css';

const GameScreen = ({ endPageFunction: gameOver }: PokemonMemoryPageProps) => {
    const [cards, setCards] = useState<CardType[]>([]);
    const [myTurn, setMyTurn] = useState<boolean>(false);
    const [disableBoard, setBoardDisable] = useState<boolean>(false);
    const [playerTurns, setPlayerTurns] = useState<number>(0);
    const [opponentTurns, setOpponentTurns] = useState<number>(0);
    const [opponentName, setOpponentName] = useState("");
    const toastTimeOnScreen = 15000;
    const socketContext = useSocketContext();
    const socket = socketContext.socket;

    useEffect(() => {                  
        socket.emit('getPlayersName'); 
        socket.emit("initializeGameForUI");

        // Cleanup function to handle unmounting
        return () => {
            socket.off("initializeGameForUI");
            socket.off("getPlayersName");
        };
    }, []);

    useEffect(() => {
        
        // Event listener for when opponent data is received
        const initializeGameForUI = ({ cards, currentPlayerTurn: myTurn}: Result) => {
            setCards(cards);
            setMyTurn(myTurn);
        }   
         

        const setPlayersName = ({ opponentName }: { myName: string; opponentName: string }) => {            
            setOpponentName(opponentName);
        };  

        const myMove = ({ cards, currentPlayerTurn: myTurn, disableBoard, currentPlayerMovesCount: myMovesCount }: MoveResult) => {  
            setCards(cards);
            setMyTurn(myTurn);
            setBoardDisable(disableBoard);
            setPlayerTurns(myMovesCount);
        }

        const opponentMove = ({ cards, currentPlayerTurn: myTurn, disableBoard, currentPlayerMovesCount: opponentMovesCount}: MoveResult) => {  
            setCards(cards);
            setMyTurn(myTurn);
            setBoardDisable(disableBoard);
            setOpponentTurns(opponentMovesCount); 
        }

        const handleHideCards = ({ cards, currentPlayerTurn: myTurn, disableBoard }: MoveResult) => {
            setCards(cards);
            setMyTurn(myTurn);
            setBoardDisable(disableBoard);
        };

        const handleGameOver = ({ i_WinnerName, i_Points, i_Moves }: { i_WinnerName: string | undefined , i_Points: number, i_Moves: number }) => {
            const winingMessage = (
                <div className="text-center text-white">
                    <p className="font-bold">Game Ended!</p>
                    {i_WinnerName ? <p>Winner: {i_WinnerName}</p> : <p>It's a Draw</p>}
                    <p>Points: {i_Points}</p>
                    <p>Number of Moves: {i_Moves}</p>
                    <button
                        onClick={gameOver}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >Start New Game</button>
                </div>
            );
            
            // Show a toast notification with the winner's name
            toast(winingMessage);
            setBoardDisable(true);            

            // Redirect to the landing page after 5 seconds
            setTimeout(() => {
                gameOver();
            }, toastTimeOnScreen);
        };

        socket.on("initializeGameForUI", initializeGameForUI );
        socket.on('setPlayersName', setPlayersName)
        socket.on("myMove", myMove);
        socket.on("opponentMove", opponentMove);
        socket.on('hideCards', handleHideCards);
        socket.on('gameOver', handleGameOver);

        return () => {
            socket.off("initializeGameForUI");
            socket.off('setPlayersName')
            socket.off("myMove");
            socket.off("opponentMove");
            socket.off('hideCards');
            socket.off('gameOver');
        };
        
      }, [socket]);

    const handleMove = (i_CardId: number) => {
        socket.emit("move", i_CardId);
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