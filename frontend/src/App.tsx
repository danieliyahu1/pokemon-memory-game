import { useState } from 'react';
import Landing from './pages/Landing'
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import GameScreen from './pages/GameScreen';

export type PokemonMemoryPageProps = {
  endPageFunction: (playerName: string) => void;
  playerName: string;
}

function App() {
  const [showGame, setShowGame] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>("");
  const handleStartGame = (i_PlayerName: string) => {
    setShowGame(true);
    setPlayerName(i_PlayerName);
  };
  const handleGameOver = (i_PlayerName: string) => {
    setShowGame(false);
    setPlayerName(i_PlayerName);
  };
  return (
    <div  className="bg-gray-800 min-h-screen">
      <Router>
        <Routes>
            <Route path="/" element={
              showGame ? <GameScreen playerName={playerName} endPageFunction={(playerName)=>handleGameOver(playerName)}/>: <Landing playerName={playerName} endPageFunction={(playerName)=>handleStartGame(playerName)}/>}/>
        </Routes>        
      </Router>
      
    </div>
  )
}

export default App
