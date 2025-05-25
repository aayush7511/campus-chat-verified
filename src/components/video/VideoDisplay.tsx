
import { forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Video, VideoOff } from "lucide-react";

interface VideoDisplayProps {
  userEmail: string;
  partnerEmail: string | null;
  partnerConnected: boolean;
  isSearching: boolean;
  activeUsersCount: number;
  isVideoOn: boolean;
  connectionState: RTCPeerConnectionState | null;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

const VideoDisplay = forwardRef<HTMLDivElement, VideoDisplayProps>(({
  userEmail,
  partnerEmail,
  partnerConnected,
  isSearching,
  activeUsersCount,
  isVideoOn,
  connectionState,
  localVideoRef,
  remoteVideoRef
}, ref) => {
  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Local Video */}
      <Card className="bg-black/20 border-white/20 relative overflow-hidden">
        <CardContent className="p-0 h-full">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm">
            You ({userEmail.split('@')[0]})
          </div>
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remote Video */}
      <Card className="bg-black/20 border-white/20 relative overflow-hidden">
        <CardContent className="p-0 h-full">
          {partnerConnected ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-white text-sm">
                {partnerEmail?.split('@')[0]}
              </div>
              {connectionState !== 'connected' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p>Connecting video...</p>
                    <p className="text-sm mt-1">State: {connectionState}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              {isSearching ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p>Looking for a student to connect with...</p>
                  <p className="text-sm mt-2">{activeUsersCount} students online</p>
                </div>
              ) : (
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4" />
                  <p>Click "Start Chat" to begin</p>
                  <p className="text-sm mt-2">{activeUsersCount} students online</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

VideoDisplay.displayName = "VideoDisplay";

export default VideoDisplay;
