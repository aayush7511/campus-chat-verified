import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { matchingService } from "@/services/matchingService";
import { webrtcService } from "@/services/webrtcService";
import { signalingService } from "@/services/signalingService";

export const useVideoChat = (userEmail: string) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState<string | null>(null);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  const updateActiveUsersCount = async () => {
    try {
      const count = await matchingService.getActiveUsersCount();
      setActiveUsersCount(count);
    } catch (error) {
      console.error("Error getting active users count:", error);
    }
  };

  const initiateWebRTCConnection = async (shouldInitiate: boolean) => {
    try {
      console.log("Initiating WebRTC connection, shouldInitiate:", shouldInitiate);
      
      if (shouldInitiate) {
        // Wait a bit for both sides to be ready
        setTimeout(async () => {
          if (signalingService.areBothReady()) {
            console.log("Both parties ready, creating offer");
            const offer = await webrtcService.createOffer();
            await signalingService.sendMessage('offer', offer);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error initiating WebRTC connection:", error);
      toast({
        title: "Connection Error",
        description: "Failed to establish video connection",
        variant: "destructive",
      });
    }
  };

  const handleMatchFound = async (roomCode: string, partner: string) => {
    console.log("Match found!", roomCode, partner);
    setCurrentRoomCode(roomCode);
    setPartnerEmail(partner);
    setPartnerConnected(true);
    setIsSearching(false);
    
    // Determine who should initiate the call (first user alphabetically)
    const shouldInitiate = userEmail < partner;
    setIsInitiator(shouldInitiate);
    console.log("Should initiate call:", shouldInitiate);
    
    try {
      // Setup signaling for WebRTC
      const signalingCleanup = await signalingService.setupSignaling(roomCode, userEmail, partner);
      cleanupFunctionsRef.current.push(signalingCleanup);

      // Setup ready state change handler
      signalingService.onReadyStateChange((bothReady) => {
        console.log("Ready state changed, both ready:", bothReady);
        if (bothReady) {
          initiateWebRTCConnection(shouldInitiate);
        }
      });

      // Setup signaling message handler
      signalingService.onMessage(async (message) => {
        console.log("Received signaling message:", message.message_type);
        
        try {
          switch (message.message_type) {
            case 'offer':
              console.log("Processing offer");
              const answer = await webrtcService.createAnswer(message.message_data);
              await signalingService.sendMessage('answer', answer);
              break;
            case 'answer':
              console.log("Processing answer");
              await webrtcService.setRemoteAnswer(message.message_data);
              break;
            case 'ice-candidate':
              console.log("Processing ICE candidate");
              await webrtcService.addIceCandidate(message.message_data);
              break;
          }
        } catch (error) {
          console.error("Error handling signaling message:", error);
        }
      });

      // Setup ICE candidate handling
      webrtcService.onIceCandidate(async (candidate) => {
        console.log("Sending ICE candidate");
        await signalingService.sendMessage('ice-candidate', candidate);
      });

    } catch (error) {
      console.error("Error setting up WebRTC:", error);
    }

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
    
    // Cleanup WebRTC and signaling
    webrtcService.cleanup();
    signalingService.cleanup();
    cleanupFunctionsRef.current.forEach(cleanup => cleanup());
    cleanupFunctionsRef.current = [];
    
    setIsConnected(false);
    setPartnerConnected(false);
    setIsSearching(false);
    setCurrentRoomCode(null);
    setPartnerEmail(null);
    setConnectionState(null);
    setIsInitiator(false);
    
    // Clear remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
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
      
      // Cleanup current connection
      webrtcService.cleanup();
      signalingService.cleanup();
      
      setPartnerConnected(false);
      setCurrentRoomCode(null);
      setPartnerEmail(null);
      setConnectionState(null);
      setIsSearching(true);
      setIsInitiator(false);
      
      // Clear remote video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      
      // Reinitialize media
      try {
        const stream = await webrtcService.getLocalStream({ 
          video: isVideoOn, 
          audio: isMicOn 
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error reinitializing media:", error);
      }
      
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

  const handleToggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    webrtcService.toggleVideo(newVideoState);
  };

  const handleToggleAudio = () => {
    const newAudioState = !isMicOn;
    setIsMicOn(newAudioState);
    webrtcService.toggleAudio(newAudioState);
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real implementation, you'd control the audio output device here
  };

  const handleSendMessage = (message: string) => {
    console.log("Sending message via WebRTC:", message);
    webrtcService.sendMessage(message);
  };

  useEffect(() => {
    // Initialize media and setup callbacks
    const initializeMedia = async () => {
      try {
        const stream = await webrtcService.getLocalStream({ 
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

    initializeMedia();
    updateActiveUsersCount();

    // Setup WebRTC callbacks
    webrtcService.onRemoteStream((stream) => {
      console.log("Received remote stream");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    webrtcService.onConnectionStateChange((state) => {
      console.log("Connection state changed:", state);
      setConnectionState(state);
      if (state === 'connected') {
        toast({
          title: "Video Connected!",
          description: "You're now connected via video call.",
        });
      } else if (state === 'failed' || state === 'disconnected') {
        console.log("Connection failed or disconnected");
      }
    });

    // Setup realtime listeners for matching
    const unsubscribe = matchingService.setupRealtimeListeners(handleMatchFound);
    cleanupFunctionsRef.current.push(unsubscribe);

    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      webrtcService.cleanup();
      signalingService.cleanup();
    };
  }, [userEmail]);

  return {
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
  };
};
