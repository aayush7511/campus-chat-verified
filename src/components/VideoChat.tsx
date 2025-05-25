
import StatusBar from "./video/StatusBar";
import VideoDisplay from "./video/VideoDisplay";
import VideoControls from "./video/VideoControls";
import ChatSection from "./video/ChatSection";
import { useVideoChat } from "@/hooks/useVideoChat";

interface VideoChatProps {
  userEmail: string;
}

const VideoChat = ({ userEmail }: VideoChatProps) => {
  const {
    isVideoOn,
    isMicOn,
    isSpeakerOn,
    isConnected,
    partnerConnected,
    isSearching,
    currentRoomCode,
    partnerEmail,
    activeUsersCount,
    connectionState,
    isInitiator,
    localVideoRef,
    remoteVideoRef,
    handleConnect,
    handleDisconnect,
    handleSkip,
    handleToggleVideo,
    handleToggleAudio,
    handleToggleSpeaker,
    handleSendMessage
  } = useVideoChat(userEmail);

  return (
    <div className="min-h-screen p-4 pt-20">
      <div className="max-w-7xl mx-auto">
        <StatusBar
          activeUsersCount={activeUsersCount}
          currentRoomCode={currentRoomCode}
          isInitiator={isInitiator}
          connectionState={connectionState}
          partnerConnected={partnerConnected}
          partnerEmail={partnerEmail}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Video Section */}
          <div className="lg:col-span-3 space-y-4">
            <VideoDisplay
              userEmail={userEmail}
              partnerEmail={partnerEmail}
              partnerConnected={partnerConnected}
              isSearching={isSearching}
              activeUsersCount={activeUsersCount}
              isVideoOn={isVideoOn}
              connectionState={connectionState}
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
            />

            <VideoControls
              isVideoOn={isVideoOn}
              isMicOn={isMicOn}
              isSpeakerOn={isSpeakerOn}
              isConnected={isConnected}
              partnerConnected={partnerConnected}
              onToggleVideo={handleToggleVideo}
              onToggleAudio={handleToggleAudio}
              onToggleSpeaker={handleToggleSpeaker}
              onConnect={handleConnect}
              onSkip={handleSkip}
              onDisconnect={handleDisconnect}
            />
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1">
            <ChatSection
              partnerConnected={partnerConnected}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
