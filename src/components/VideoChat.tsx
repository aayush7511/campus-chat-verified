
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  SkipForward, 
  Send,
  Volume2,
  VolumeX,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { matchingService } from "@/services/matchingService";

interface VideoChatProps {
  userEmail: string;
}

const VideoChat = ({ userEmail }: VideoChatProps) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'you' | 'stranger'}>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState<string | null>(null);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Start local video stream
    const startLocalVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        toast({
          title: "Camera Access Required",
          description: "Please allow camera and microphone access to continue.",
          variant: "destructive",
        });
      }
    };

    startLocalVideo();
    updateActiveUsersCount();

    // Setup realtime listeners for matching
    const unsubscribe = matchingService.setupRealtimeListeners(handleMatchFound);

    return () => {
      unsubscribe();
      handleDisconnect();
    };
  }, [userEmail]);

  const updateActiveUsersCount = async () => {
    try {
      const count = await matchingService.getActiveUsersCount();
      setActiveUsersCount(count);
    } catch (error) {
      console.error("Error getting active users count:", error);
    }
  };

  const handleMatchFound = (roomCode: string, partner: string) => {
    console.log("Match found!", roomCode, partner);
    setCurrentRoomCode(roomCode);
    setPartnerEmail(partner);
    setPartnerConnected(true);
    setIsSearching(false);
    toast({
      title: "Match Found!",
      description: `Connected with a student: ${partner.split('@')[0]}`,
    });
  };

  const handleConnect = async () => {
    setIsConnected(true);
    setIsSearching(true);
    
    try {
      await matchingService.joinQueue(userEmail);
      toast({
        title: "Searching for Students",
        description: "Looking for another student to connect with...",
      });
      
      // Update count after joining
      setTimeout(updateActiveUsersCount, 500);
    } catch (error) {
      console.error("Error joining queue:", error);
      toast({
        title: "Connection Error",
        description: "Failed to join the matching queue. Please try again.",
        variant: "destructive",
      });
      setIsConnected(false);
      setIsSearching(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (currentRoomCode) {
        await matchingService.endCurrentRoom();
      } else {
        await matchingService.leaveQueue();
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
    
    setIsConnected(false);
    setPartnerConnected(false);
    setIsSearching(false);
    setCurrentRoomCode(null);
    setPartnerEmail(null);
    setMessages([]);
    
    updateActiveUsersCount();
    
    toast({
      title: "Disconnected",
      description: "You have been disconnected from the chat.",
    });
  };

  const handleSkip = async () => {
    try {
      if (currentRoomCode) {
        await matchingService.endCurrentRoom();
      }
      
      setPartnerConnected(false);
      setCurrentRoomCode(null);
      setPartnerEmail(null);
      setMessages([]);
      setIsSearching(true);
      
      // Find new match
      await matchingService.joinQueue(userEmail);
      
      toast({
        title: "Looking for New Connection",
        description: "Searching for another student...",
      });
    } catch (error) {
      console.error("Error skipping:", error);
      toast({
        title: "Error",
        description: "Failed to find new connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && partnerConnected) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: 'you' as const
      };
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      // Simulate receiving a response (in real implementation, this would be via WebRTC or real-time messaging)
      setTimeout(() => {
        const responses = [
          "Hey! Nice to meet you!",
          "What's your major?",
          "Which university are you from?",
          "That's awesome!",
          "Cool, I'm studying computer science too!",
          "Where are you located?",
          "How are your classes going?",
          "Do you have any favorite professors?",
          "What year are you in?",
          "Are you involved in any clubs?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: randomResponse,
          sender: 'stranger'
        }]);
      }, 1000 + Math.random() * 2000);
    }
  };

  return (
    <div className="min-h-screen p-4 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Status Bar */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-4 text-white">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm">{activeUsersCount} students online</span>
            </div>
            {currentRoomCode && (
              <div className="text-sm text-gray-400">
                Room: {currentRoomCode.split('_')[1]}
              </div>
            )}
          </div>
          {partnerConnected && partnerEmail && (
            <div className="text-sm text-green-400">
              Connected to: {partnerEmail.split('@')[0]}@{partnerEmail.split('@')[1].split('.')[0]}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
          {/* Video Section */}
          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
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

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => setIsVideoOn(!isVideoOn)}
                variant={isVideoOn ? "default" : "destructive"}
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              
              <Button
                onClick={() => setIsMicOn(!isMicOn)}
                variant={isMicOn ? "default" : "destructive"}
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>

              <Button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                variant={isSpeakerOn ? "default" : "secondary"}
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>

              {!isConnected ? (
                <Button
                  onClick={handleConnect}
                  className="bg-green-500 hover:bg-green-600 px-8"
                  size="lg"
                >
                  Start Chat
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSkip}
                    variant="secondary"
                    size="lg"
                    className="rounded-full w-12 h-12 p-0"
                    disabled={!partnerConnected}
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-12 h-12 p-0"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 h-full flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="text-white font-semibold mb-4">Chat</h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.length === 0 ? (
                    <p className="text-gray-400 text-center text-sm">
                      {partnerConnected ? "Start a conversation!" : "Connect with someone to start chatting"}
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded max-w-[80%] ${
                          message.sender === 'you'
                            ? 'bg-blue-500 text-white ml-auto'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={partnerConnected ? "Type a message..." : "Connect to chat"}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    disabled={!partnerConnected}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="px-3"
                    disabled={!partnerConnected || !newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
