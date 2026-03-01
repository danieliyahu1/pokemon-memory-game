import { useState, useEffect } from 'react';
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import PlayerSearch from './components/PlayerSearch'
import PendingInvites from './components/PendingInvites'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import GameScreen from './pages/GameScreen';

export type PokemonMemoryPageProps = {
  endPageFunction: (playerName: string) => void;
  playerName: string;
  isAuthenticated?: boolean;
  authUsername?: string;
  onLogout?: () => void;
}

function AppContent({ showGame, playerName, setShowGame, setPlayerName, isAuthenticated, authUsername, handleLogout, setIsAuthenticated, setAuthUsername }: 
  { showGame: boolean; playerName: string; setShowGame: (show: boolean) => void; setPlayerName: (name: string) => void; isAuthenticated: boolean; authUsername: string; handleLogout: () => void; setIsAuthenticated: (val: boolean) => void; setAuthUsername: (val: string) => void }) {
  const navigate = useNavigate();

  const handleStartGame = (i_PlayerName: string) => {
    setShowGame(true);
    setPlayerName(i_PlayerName);
    navigate('/');
  };

  const handleGameOver = (i_PlayerName: string) => {
    setShowGame(false);
    setPlayerName(i_PlayerName);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={(username) => {
          setIsAuthenticated(true);
          setAuthUsername(username);
          navigate('/');
        }} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<PlayerSearch isAuthenticated={isAuthenticated} authUsername={authUsername} onLogout={handleLogout} />} />
        <Route path="/" element={
          showGame ? <GameScreen playerName={playerName} endPageFunction={(playerName)=>handleGameOver(playerName)}/>: <Landing playerName={playerName} endPageFunction={(playerName)=>handleStartGame(playerName)} isAuthenticated={isAuthenticated} authUsername={authUsername} onLogout={handleLogout}/>}/>
      </Routes>
      {isAuthenticated && <PendingInvites onGameStarting={() => handleStartGame(authUsername || "")} />}
    </>
  );
}

function App() {
  const [showGame, setShowGame] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string>("");

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    if (token && username) {
      setIsAuthenticated(true);
      setAuthUsername(username);
    }
  }, []);

  useEffect(() => {
    // Listen for storage changes (e.g., login from another tab or explicit logout)
    const handleStorageChange = () => {
      const token = localStorage.getItem('authToken');
      const username = localStorage.getItem('username');
      if (token && username) {
        setIsAuthenticated(true);
        setAuthUsername(username);
      } else {
        setIsAuthenticated(false);
        setAuthUsername("");
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setAuthUsername("");
    // Dispatch custom event to notify SocketProvider about token change
    window.dispatchEvent(new Event('authTokenUpdated'));
  };

  return (
    <div  className="bg-gray-800 min-h-screen">
      <Router>
        <AppContent 
          showGame={showGame}
          playerName={playerName}
          setShowGame={setShowGame}
          setPlayerName={setPlayerName}
          isAuthenticated={isAuthenticated}
          authUsername={authUsername}
          handleLogout={handleLogout}
          setIsAuthenticated={setIsAuthenticated}
          setAuthUsername={setAuthUsername}
        />
      </Router>
    </div>
  )
}

export default App
