
export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onDataChannelMessageCallback: ((message: string) => void) | null = null;

  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    console.log("Initializing peer connection with config:", this.config);
    this.peerConnection = new RTCPeerConnection(this.config);

    // Set up event handlers
    this.peerConnection.onicecandidate = (event) => {
      console.log("ICE candidate event:", event.candidate);
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log("Remote track received:", event.streams);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log("Connection state changed:", this.peerConnection.connectionState);
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
        }
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log("ICE connection state changed:", this.peerConnection.iceConnectionState);
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      console.log("Data channel received:", event.channel);
      const channel = event.channel;
      channel.onmessage = (event) => {
        console.log("Data channel message received:", event.data);
        if (this.onDataChannelMessageCallback) {
          this.onDataChannelMessageCallback(event.data);
        }
      };
    };
  }

  async getLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      console.log("Getting local media stream with constraints:", constraints);
      
      // Stop existing tracks if any
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Local stream obtained:", this.localStream);
      
      if (this.peerConnection) {
        // Clear existing senders
        this.peerConnection.getSenders().forEach(sender => {
          if (sender.track) {
            this.peerConnection?.removeTrack(sender);
          }
        });

        // Add new tracks
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            console.log("Adding track to peer connection:", track.kind, track.label);
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }
      
      return this.localStream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log("Creating offer");
    
    // Create data channel for chat
    this.dataChannel = this.peerConnection.createDataChannel('chat', {
      ordered: true
    });
    
    this.dataChannel.onopen = () => {
      console.log("Data channel opened");
    };
    
    this.dataChannel.onmessage = (event) => {
      console.log("Data channel message:", event.data);
      if (this.onDataChannelMessageCallback) {
        this.onDataChannelMessageCallback(event.data);
      }
    };

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    
    await this.peerConnection.setLocalDescription(offer);
    console.log("Offer created and set as local description:", offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log("Creating answer for offer:", offer);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log("Answer created and set as local description:", answer);
    return answer;
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log("Setting remote answer:", answer);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log("Adding ICE candidate:", candidate);
    try {
      if (this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        console.log("Remote description not set yet, queuing ICE candidate");
        // Store candidates if remote description isn't set yet
        setTimeout(() => this.addIceCandidate(candidate), 100);
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  sendMessage(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      console.log("Sending data channel message:", message);
      this.dataChannel.send(message);
    } else {
      console.error("Data channel not available or not open");
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        console.log("Video track enabled:", enabled);
      }
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        console.log("Audio track enabled:", enabled);
      }
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void): void {
    this.onIceCandidateCallback = callback;
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChangeCallback = callback;
  }

  onDataChannelMessage(callback: (message: string) => void): void {
    this.onDataChannelMessageCallback = callback;
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection ? this.peerConnection.connectionState : null;
  }

  cleanup(): void {
    console.log("Cleaning up WebRTC service");
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.onRemoteStreamCallback = null;
    this.onIceCandidateCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.onDataChannelMessageCallback = null;

    // Reinitialize for next use
    this.initializePeerConnection();
  }
}

export const webrtcService = new WebRTCService();
