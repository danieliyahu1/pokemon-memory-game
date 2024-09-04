import { useState } from 'react';
import Landing from './pages/Landing'
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import GameScreen from './pages/GameScreen';

export type PokemonMemoryPageProps = {
  endPageFunction: () => void;
}

function App() {
  const [showGame, setShowGame] = useState<boolean>(false);
  const handleStartGame = () => {
    setShowGame(true);
  };
  const handleGameOver = () => {
    setShowGame(false);
  };
  return (
    <div  className="bg-gray-800 min-h-screen">
      <Router>
        <Routes>
            <Route path="/" element={
              showGame ? <GameScreen endPageFunction={handleGameOver}/>: <Landing endPageFunction={handleStartGame}/>}/>
        </Routes>        
      </Router>
      
    </div>
  )
}

export default App
