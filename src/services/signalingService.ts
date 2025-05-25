
import { supabase } from "@/integrations/supabase/client";

export interface SignalingMessage {
  id?: string;
  room_code: string;
  sender_email: string;
  message_type: 'offer' | 'answer' | 'ice-candidate';
  message_data: any;
  created_at?: string;
}

class SignalingService {
  private roomCode: string | null = null;
  private userEmail: string | null = null;
  private onMessageCallback: ((message: SignalingMessage) => void) | null = null;
  private channel: any = null;

  async setupSignaling(roomCode: string, userEmail: string): Promise<() => void> {
    this.roomCode = roomCode;
    this.userEmail = userEmail;

    console.log("Setting up signaling for room:", roomCode, "user:", userEmail);

    // Create a unique channel for this room
    this.channel = supabase.channel(`signaling-${roomCode}`);

    // Listen for broadcast messages
    this.channel
      .on('broadcast', { event: 'signaling' }, (payload: any) => {
        console.log("Received signaling broadcast:", payload);
        const message = payload.payload as SignalingMessage;
        
        // Don't process our own messages
        if (message.sender_email !== this.userEmail && this.onMessageCallback) {
          console.log("Processing signaling message from:", message.sender_email);
          this.onMessageCallback(message);
        }
      })
      .subscribe((status) => {
        console.log("Signaling channel status:", status);
      });

    return () => {
      console.log("Cleaning up signaling channel");
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  async sendMessage(messageType: SignalingMessage['message_type'], messageData: any): Promise<void> {
    if (!this.roomCode || !this.userEmail || !this.channel) {
      throw new Error('Signaling not initialized');
    }

    const message: SignalingMessage = {
      room_code: this.roomCode,
      sender_email: this.userEmail,
      message_type: messageType,
      message_data: messageData,
      created_at: new Date().toISOString()
    };

    console.log('Sending signaling message:', message);
    
    // Send via Supabase realtime broadcast
    await this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message
    });
  }

  onMessage(callback: (message: SignalingMessage) => void): void {
    this.onMessageCallback = callback;
  }

  cleanup(): void {
    console.log("Cleaning up signaling service");
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.roomCode = null;
    this.userEmail = null;
    this.onMessageCallback = null;
  }
}

export const signalingService = new SignalingService();
