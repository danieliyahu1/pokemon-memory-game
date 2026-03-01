import { useState, useEffect } from "react";
import { useSocketContext } from "../contexts/SocketContext";

interface SentInvite {
  inviteId: string;
  toUsername: string;
  toUserId: string;
}

interface ReceivedInvite {
  inviteId: string;
  fromUsername: string;
  fromUserId: string;
}

interface PendingInvitesProps {
  onGameStarting?: () => void;
}

const PendingInvites = ({ onGameStarting }: PendingInvitesProps) => {
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInvite[]>([]);
  const socketContext = useSocketContext();
  const socket = socketContext.socket;

  useEffect(() => {
    // Request pending invites on component mount
    socket.emit("getPendingInvites");

    const handlePendingInvites = (data: {
      sent: SentInvite[];
      received: ReceivedInvite[];
    }) => {
      setSentInvites(data.sent);
      setReceivedInvites(data.received);
    };

    const handleInviteReceived = (data: {
      inviteId: string;
      fromUsername: string;
      fromUserId: string;
    }) => {
      setReceivedInvites(prev => [
        ...prev,
        {
          inviteId: data.inviteId,
          fromUsername: data.fromUsername,
          fromUserId: data.fromUserId,
        }
      ]);
    };

    const handleInviteCancelled = (data: { inviteId: string }) => {
      setReceivedInvites(prev =>
        prev.filter(invite => invite.inviteId !== data.inviteId)
      );
    };

    const handleGameStarting = () => {
      if (onGameStarting) {
        onGameStarting();
      }
    };

    socket.on("pendingInvites", handlePendingInvites);
    socket.on("gameInviteReceived", handleInviteReceived);
    socket.on("gameInviteCancelled", handleInviteCancelled);
    socket.on("startGame", handleGameStarting);

    return () => {
      socket.off("pendingInvites", handlePendingInvites);
      socket.off("gameInviteReceived", handleInviteReceived);
      socket.off("gameInviteCancelled", handleInviteCancelled);
      socket.off("startGame", handleGameStarting);
    };
  }, [socket, onGameStarting]);

  const handleAcceptInvite = (inviteId: string) => {
    console.log(`Accepting invite: ${inviteId}`);
    socket.emit("acceptGameInvite", { inviteId });
  };

  const handleRejectInvite = (inviteId: string) => {
    socket.emit("rejectGameInvite", { inviteId });
    setReceivedInvites(prev =>
      prev.filter(invite => invite.inviteId !== inviteId)
    );
  };

  const handleCancelInvite = (inviteId: string) => {
    socket.emit("cancelGameInvite", { inviteId });
    setSentInvites(prev =>
      prev.filter(invite => invite.inviteId !== inviteId)
    );
  };

  const hasInvites = sentInvites.length > 0 || receivedInvites.length > 0;

  if (!hasInvites) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-sm bg-gray-700 rounded-lg p-4 shadow-lg border border-gray-600">
      <h3 className="text-white font-bold text-lg mb-3">
        Game Invitations {hasInvites ? `(${sentInvites.length + receivedInvites.length})` : ""}
      </h3>

      {receivedInvites.length > 0 && (
        <div className="mb-4">
          <h4 className="text-white text-sm font-semibold mb-2">Invitations Received:</h4>
          <div className="space-y-2">
            {receivedInvites.map(invite => (
              <div key={invite.inviteId} className="bg-gray-600 p-2 rounded text-sm">
                <p className="text-white mb-2">
                  <span className="font-semibold">{invite.fromUsername}</span> invites you to play
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.inviteId)}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold flex-1"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite.inviteId)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-bold flex-1"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentInvites.length > 0 && (
        <div>
          <h4 className="text-white text-sm font-semibold mb-2">Invitations Sent:</h4>
          <div className="space-y-2">
            {sentInvites.map(invite => (
              <div key={invite.inviteId} className="bg-gray-600 p-2 rounded text-sm flex justify-between items-center">
                <span className="text-white">
                  Waiting for <span className="font-semibold">{invite.toUsername}</span>...
                </span>
                <button
                  onClick={() => handleCancelInvite(invite.inviteId)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingInvites;
