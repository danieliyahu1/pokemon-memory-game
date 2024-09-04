import React from "react";

type HeaderProps = {
  gameName: string;
  opponentName: string;
  myTurn: boolean;
  playerTurns: number;
  opponentTurns: number;
}

const GameHeader: React.FC<HeaderProps> = ({
  gameName,
  opponentName,
  myTurn,
  playerTurns,
  opponentTurns,
}) => {
  return (
    <div className="bg-gray-700 text-white py-4 px-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">{gameName}</h1>
      <div className="w-full flex justify-between">
        {/* Player column */}
        <div
          className={`text-lg flex flex-col items-center w-1/3 p-4 rounded-lg ${
            myTurn ? "border-4 border-green-500 shadow-lg" : ""
          }`}
        >
          <p className="font-semibold">You</p>
          <p>{`Moves: ${playerTurns}`}</p>
          
        </div>
        
        {/* Opponent column */}
        <div
          className={`text-lg flex flex-col items-center w-1/3 p-4 rounded-lg ${
            !myTurn ? "border-4 border-green-500 shadow-lg" : ""
          }`}
        >
          <p className="font-semibold">{opponentName}</p>
          <p>{`Moves: ${opponentTurns}`}</p>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
