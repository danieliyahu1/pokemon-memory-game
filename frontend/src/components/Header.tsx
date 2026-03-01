import React from "react";

type HeaderProps = {
  gameName: string;
  opponentName: string;
  myTurn: boolean;
  playerTurns: number;
  opponentTurns: number;
  playerPoints: number;
  opponentPoints: number;
}

const GameHeader: React.FC<HeaderProps> = ({
  gameName,
  opponentName,
  myTurn,
  playerTurns,
  opponentTurns,
  playerPoints,
  opponentPoints,
}) => {
  return (
    <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white py-6 px-6 flex flex-col items-center shadow-lg border-b-2 border-blue-500">
      <style>{`
        @keyframes pulse-active {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
        }
        .turn-active {
          animation: pulse-active 2s infinite;
        }
      `}</style>
      <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{gameName}</h1>
      <div className="w-full flex justify-between gap-4">
        {/* Player column */}
        <div
          className={`text-lg flex flex-col items-center flex-1 p-5 rounded-xl transition-all duration-300 ${
            myTurn 
              ? "turn-active border-3 border-green-500 bg-gradient-to-b from-green-900 to-gray-800 shadow-xl" 
              : "border-2 border-gray-500 bg-gray-800"
          }`}
        >
          <p className="font-bold text-xl mb-2">You</p>
          <div className="flex gap-6 text-sm">
            <div className="flex flex-col items-center">
              <p className="text-gray-400">Moves</p>
              <p className="text-2xl font-bold text-blue-400">{playerTurns}</p>
            </div>
            <div className="w-px bg-gray-500"></div>
            <div className="flex flex-col items-center">
              <p className="text-gray-400">Points</p>
              <p className="text-2xl font-bold text-green-400">{playerPoints}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center">
          <div className="h-16 w-1 bg-gray-600 rounded"></div>
        </div>
        
        {/* Opponent column */}
        <div
          className={`text-lg flex flex-col items-center flex-1 p-5 rounded-xl transition-all duration-300 ${
            !myTurn 
              ? "turn-active border-3 border-green-500 bg-gradient-to-b from-green-900 to-gray-800 shadow-xl" 
              : "border-2 border-gray-500 bg-gray-800"
          }`}
        >
          <p className="font-bold text-xl mb-2">{opponentName}</p>
          <div className="flex gap-6 text-sm">
            <div className="flex flex-col items-center">
              <p className="text-gray-400">Moves</p>
              <p className="text-2xl font-bold text-blue-400">{opponentTurns}</p>
            </div>
            <div className="w-px bg-gray-500"></div>
            <div className="flex flex-col items-center">
              <p className="text-gray-400">Points</p>
              <p className="text-2xl font-bold text-green-400">{opponentPoints}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
