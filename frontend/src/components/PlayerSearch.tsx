import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../contexts/SocketContext";

interface SearchResult {
  id: string;
  username: string;
}

interface InviteState {
  [key: string]: boolean; // Track which users have pending invites
}

interface PlayerSearchProps {
  isAuthenticated?: boolean;
  authUsername?: string;
  onLogout?: () => void;
}

const PlayerSearch = ({ isAuthenticated, authUsername, onLogout }: PlayerSearchProps) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [sentInvites, setSentInvites] = useState<InviteState>({});
  const navigate = useNavigate();
  const socketContext = useSocketContext();
  const socket = socketContext.socket;
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    // Listen for invite status updates
    socket.on("inviteSent", () => {
      for (const result of searchResults) {
        if (!sentInvites[result.id]) {
          setSentInvites(prev => ({
            ...prev,
            [result.id]: true
          }));
          break;
        }
      }
    });

    socket.on("inviteError", (data: { error: string }) => {
      setError(data.error);
    });

    return () => {
      socket.off("inviteSent");
      socket.off("inviteError");
    };
  }, [socket, searchResults, sentInvites]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a username to search");
      return;
    }

    setLoading(true);
    setError("");
    setSearchResults([]);

    try {
      const response = await fetch(
        `/api/users/search?username=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        setError("Search failed");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSearchResults(data.users || []);

      if (data.users.length === 0) {
        setError("No users found");
      }
    } catch (err) {
      setError("An error occurred during search");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = (userId: string, username: string) => {
    socket.emit("sendGameInvite", {
      toUserId: userId,
      toUsername: username,
    });
    setSentInvites(prev => ({
      ...prev,
      [userId]: true
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/');
  };

  return (
    <div className="max-w-[860px] mx-auto py-10 flex flex-col items-center min-h-screen">
      <div className="w-full flex justify-between items-center mb-10">
        <h1 className="text-white text-3xl font-bold text-center flex-1">Search for Friend</h1>
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <>
              <span className="text-white text-sm">Welcome, <span className="font-bold">{authUsername}</span></span>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold"
              >
                Logout
              </button>
            </>
          )}
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-bold"
          >
            Back
          </button>
        </div>
      </div>

      <div className="w-full max-w-md mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-2 border-slate-300 p-3 text-lg text-black bg-white rounded-md focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-bold disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      <div className="w-full max-w-md">
        {searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
              >
                <span className="text-white font-semibold">{user.username}</span>
                <button
                  onClick={() => handleInvite(user.id, user.username)}
                  disabled={sentInvites[user.id]}
                  className={`px-3 py-1 rounded text-sm font-bold ${
                    sentInvites[user.id]
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {sentInvites[user.id] ? "Invite Sent" : "Invite"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerSearch;
