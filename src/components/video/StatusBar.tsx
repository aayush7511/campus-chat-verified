
import { Users } from "lucide-react";

interface StatusBarProps {
  activeUsersCount: number;
  currentRoomCode: string | null;
  isInitiator: boolean;
  connectionState: RTCPeerConnectionState | null;
  partnerConnected: boolean;
  partnerEmail: string | null;
}

const StatusBar = ({
  activeUsersCount,
  currentRoomCode,
  isInitiator,
  connectionState,
  partnerConnected,
  partnerEmail
}: StatusBarProps) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <div className="flex items-center space-x-4 text-white">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-400" />
          <span className="text-sm">{activeUsersCount} students online</span>
        </div>
        {currentRoomCode && (
          <div className="text-sm text-gray-400">
            Room: {currentRoomCode.split('_')[1]} {isInitiator ? "(Initiator)" : "(Receiver)"}
          </div>
        )}
        {connectionState && (
          <div className={`text-sm ${
            connectionState === 'connected' ? 'text-green-400' : 
            connectionState === 'connecting' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            Video: {connectionState}
          </div>
        )}
      </div>
      {partnerConnected && partnerEmail && (
        <div className="text-sm text-green-400">
          Connected to: {partnerEmail.split('@')[0]}@{partnerEmail.split('@')[1].split('.')[0]}
        </div>
      )}
    </div>
  );
};

export default StatusBar;
