
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

  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    console.log("Initializing peer connection");
    this.peerConnection = new RTCPeerConnection(this.config);

    this.peerConnection.onicecandidate = (event) => {
      console.log("ICE candidate event:", event.candidate);
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log("Remote track received:", event.streams);
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
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

    this.peerConnection.onicegatheringstatechange = () => {
      if (this.peerConnection) {
        console.log("ICE gathering state changed:", this.peerConnection.iceGatheringState);
      }
    };
  }

  async getLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      console.log("Getting local media stream");
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.peerConnection) {
        // Remove existing tracks first
        this.peerConnection.getSenders().forEach(sender => {
          if (sender.track) {
            this.peerConnection?.removeTrack(sender);
          }
        });

        // Add new tracks
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            console.log("Adding track to peer connection:", track.kind);
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
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection.setLocalDescription(offer);
    console.log("Offer created and set as local description");
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log("Creating answer for offer:", offer);
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    console.log("Answer created and set as local description");
    return answer;
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log("Setting remote answer:", answer);
    await this.peerConnection.setRemoteDescription(answer);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    console.log("Adding ICE candidate:", candidate);
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
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

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection ? this.peerConnection.connectionState : null;
  }

  cleanup(): void {
    console.log("Cleaning up WebRTC service");
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
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

    // Reinitialize for next use
    this.initializePeerConnection();
  }
}

export const webrtcService = new WebRTCService();
