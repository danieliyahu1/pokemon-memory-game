import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../contexts/SocketContext";
import loadingGif from '/gif/loading.gif';
import {PokemonMemoryPageProps} from '../App'
  
  const Landing = ({ playerName, endPageFunction: onStartGame, isAuthenticated, authUsername, onLogout }: PokemonMemoryPageProps)=> {
    
    const [error, setError] = useState<string>(''); // Add state for validation message
    const [loading, setLoading] = useState(false);
    const inputNameRef = useRef<HTMLInputElement>(null);
    const myNameRef = useRef<string | undefined>(undefined);
    const socketContext = useSocketContext();
    const socket = socketContext.socket;
    const navigate = useNavigate();

    useEffect(() => {
        // Event listener for when opponent data is received
        socket.on("startGame", () => {
          console.log("startGame event received in Landing page");
          // For invited games, use authenticated username if available
          const playerNameToUse = myNameRef.current || authUsername;
          
          if(playerNameToUse === undefined)
          {
            throw new Error("Can not start game without a player name");
          }
          console.log(`Starting game with player name: ${playerNameToUse}`);
            onStartGame(playerNameToUse);            
        });

        socket.on("inviteError", (data: { error: string }) => {
          setError(data.error);
          setLoading(false);
        });

        return () => {
          socket.off("startGame");
          socket.off("inviteError");
        };
      }, [socket, onStartGame, authUsername]);
    
    const handlePlayOnlineClick = () => {
      let name: string;
      
      if (isAuthenticated) {
        // Authenticated users must use their registered username
        name = authUsername!;
      } else {
        // Unauthenticated users can enter any name
        name = inputNameRef.current?.value.trim() || playerName;
      }
      
      if(name)
      {
        myNameRef.current = name;
        setLoading(true);
        setError('');           
        socket.emit("find", {name: name});
      }
      else
      {
          setError('Name is required.');
      }
    };

    const handlePlayAgaisntComputerClick = () => {
      let name: string;
      
      if (isAuthenticated) {
        // Authenticated users must use their registered username
        name = authUsername!;
      } else {
        // Unauthenticated users can enter any name
        name = inputNameRef.current?.value.trim() || playerName;
      }
      
      if(name)
      {
        myNameRef.current = name;
        setLoading(true);
        setError('');  
        socket.emit("playAlone", {name: name});
      }
      else
      {
          setError('Name is required.');
      }
  };

  const handleSearchForFriend = () => {
    navigate('/search');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setLoading(false);
    setError('');
  };

  return (
    <div className="max-w-[860px] mx-auto py-10 flex flex-col items-center min-h-screen">
      {/* Header with auth info */}
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center mb-10">
        <div className="min-h-[32px]" />
        <h1 className="text-white text-3xl font-bold text-center">Pokemon Memory Game</h1>
        <div className="flex items-center justify-end gap-4 min-h-[32px]">
          {isAuthenticated ? (
            <>
              <span className="text-white text-sm">Welcome, <span className="font-bold">{authUsername}</span></span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

        
        { playerName !== "" ? <span className="my-5 text-white text-xl mb-4">{`Let's go again ${playerName}!`}</span> : 
        <>
          {isAuthenticated ? (
            <p className="my-5 text-white text-xl mb-4">Playing as: <span className="font-bold">{authUsername}</span></p>
          ) : (
            <>
              <p id="enterName" className="my-5 text-white text-xl mb-4">Enter your name</p>
              <input ref={inputNameRef} type="text" placeholder="Name" id="name" autoComplete="off" className={`border-2 border-slate-300 mb-5 p-3 text-lg text-black bg-white rounded-md focus:outline-none focus:border-blue-500 ${error ? 'border-red-500' : ''}`} />
            </>
          )}
        </>}

        {error && <p className="text-red-500">{error}</p>} 
    
        <button onClick={handlePlayOnlineClick} id="find" className="mb-2 text-xl text-white bg-black px-3 py-1 rounded-md">Play online</button>
        <button onClick={handlePlayAgaisntComputerClick} id="find" className="mb-2 text-xl text-white bg-black px-3 py-1 rounded-md">Against computer</button>

        {isAuthenticated && (
          <button onClick={handleSearchForFriend} className="mb-2 text-xl text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-md">Search for Friend</button>
        )}

        {loading && (
        <img id="loading" src={loadingGif} alt="Loading" className="w-[30px] mt-4" />
      )}
    </div>
  );
}

export default Landing;
