
import { Button } from "@/components/ui/button";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react";

interface VideoControlsProps {
  isVideoOn: boolean;
  isMicOn: boolean;
  isSpeakerOn: boolean;
  isConnected: boolean;
  partnerConnected: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleSpeaker: () => void;
  onConnect: () => void;
  onSkip: () => void;
  onDisconnect: () => void;
}

const VideoControls = ({
  isVideoOn,
  isMicOn,
  isSpeakerOn,
  isConnected,
  partnerConnected,
  onToggleVideo,
  onToggleAudio,
  onToggleSpeaker,
  onConnect,
  onSkip,
  onDisconnect
}: VideoControlsProps) => {
  return (
    <div className="flex justify-center space-x-4">
      <Button
        onClick={onToggleVideo}
        variant={isVideoOn ? "default" : "destructive"}
        size="lg"
        className="rounded-full w-12 h-12 p-0"
      >
        {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </Button>
      
      <Button
        onClick={onToggleAudio}
        variant={isMicOn ? "default" : "destructive"}
        size="lg"
        className="rounded-full w-12 h-12 p-0"
      >
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </Button>

      <Button
        onClick={onToggleSpeaker}
        variant={isSpeakerOn ? "default" : "secondary"}
        size="lg"
        className="rounded-full w-12 h-12 p-0"
      >
        {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </Button>

      {!isConnected ? (
        <Button
          onClick={onConnect}
          className="bg-green-500 hover:bg-green-600 px-8"
          size="lg"
        >
          Start Chat
        </Button>
      ) : (
        <>
          <Button
            onClick={onSkip}
            variant="secondary"
            size="lg"
            className="rounded-full w-12 h-12 p-0"
            disabled={!partnerConnected}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={onDisconnect}
            variant="destructive"
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            <Phone className="w-5 h-5" />
          </Button>
        </>
      )}
    </div>
  );
};

export default VideoControls;
