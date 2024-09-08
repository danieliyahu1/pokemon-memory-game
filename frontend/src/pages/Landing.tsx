import { useEffect, useRef, useState } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import loadingGif from '/gif/loading.gif';
import {PokemonMemoryPageProps} from '../App'


//import { shuffleCards } from "../components/GameManager";


  
  const Landing = ({ endPageFunction: onStartGame }: PokemonMemoryPageProps)=> {

    const [error, setError] = useState<string>(''); // Add state for validation message
    const [loading, setLoading] = useState(false);
    const inputNameRef = useRef<HTMLInputElement>(null);
    const socketContext = useSocketContext();
    const socket = socketContext.socket;

    useEffect(() => {
        // Event listener for when opponent data is received
        socket.on("startGame", () => {
            onStartGame();
        });

        return () => {
          socket.off("startGame");
        };
      }, [socket]);
    
    const handlePlayOnlineClick = () => {
        const myName = inputNameRef.current?.value.trim();
        if(myName)
            {
              setLoading(true);
              setError('');           
              socket.emit("find", {name:myName});
            }
        else{
            setError('Name is required.');
        }
    };

    const handlePlayAgaisntComputerClick = () => {
      const myName = inputNameRef.current?.value.trim();
      if(myName)
          {
            setLoading(true);
            setError('');           
            socket.emit("playAlone", {name:myName});
          }
      else{
          setError('Name is required.');
      }
  };

  return (
    <div className="max-w-[860px] mx-auto py-10 flex flex-col items-center min-h-screen">
      <h1 className=" text-white text-3xl font-bold text-center">Pokemon Memory Game</h1>
      {/* <button className="my-5 bg-transparent border-2 border-white py-1.5 px-3 rounded text-white font-bold cursor-pointer text-base hover:bg-[#c23866]">
        New Game
      </button> */}

        
        <p id="enterName" className="my-5 text-white text-xl mb-4">Enter your name:</p>
        <input ref={inputNameRef} type="text" placeholder="Name" id="name" autoComplete="off" className={`border border-slate-300 mb-5 p-1 text-lg ${error ? 'border-red-500' : ''}`} />
        {error && <p className="text-red-500">{error}</p>} 
    
        <button onClick={handlePlayOnlineClick} id="find" className="mb-2 text-xl text-white bg-black px-3 py-1 rounded-md">Play online</button>
        <button onClick={handlePlayAgaisntComputerClick} id="find" className="text-xl text-white bg-black px-3 py-1 rounded-md">Agaisnt comuter</button>

        {loading && (
        <img id="loading" src={loadingGif} alt="Loading" className="w-[30px] mt-4" />
      )}
    </div>
  );
}

export default Landing;
