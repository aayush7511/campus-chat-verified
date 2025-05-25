
import { supabase } from "@/integrations/supabase/client";

export interface SignalingMessage {
  id?: string;
  room_code: string;
  sender_email: string;
  recipient_email: string;
  message_type: 'offer' | 'answer' | 'ice-candidate' | 'ready';
  message_data: any;
  created_at?: string;
}

class SignalingService {
  private roomCode: string | null = null;
  private userEmail: string | null = null;
  private partnerEmail: string | null = null;
  private onMessageCallback: ((message: SignalingMessage) => void) | null = null;
  private channel: any = null;
  private isReady: boolean = false;
  private partnerReady: boolean = false;
  private onReadyStateChangeCallback: ((bothReady: boolean) => void) | null = null;

  async setupSignaling(roomCode: string, userEmail: string, partnerEmail: string): Promise<() => void> {
    this.roomCode = roomCode;
    this.userEmail = userEmail;
    this.partnerEmail = partnerEmail;
    this.isReady = false;
    this.partnerReady = false;

    console.log("Setting up signaling for room:", roomCode, "user:", userEmail, "partner:", partnerEmail);

    // Create a unique channel for this room
    this.channel = supabase.channel(`signaling-${roomCode}`, {
      config: {
        broadcast: {
          self: false
        }
      }
    });

    // Listen for broadcast messages
    this.channel
      .on('broadcast', { event: 'signaling' }, (payload: any) => {
        console.log("Received signaling broadcast:", payload);
        const message = payload.payload as SignalingMessage;
        
        // Only process messages intended for us
        if (message.recipient_email === this.userEmail && message.sender_email === this.partnerEmail) {
          console.log("Processing signaling message:", message.message_type);
          
          if (message.message_type === 'ready') {
            this.partnerReady = true;
            console.log("Partner is ready");
            if (this.onReadyStateChangeCallback) {
              this.onReadyStateChangeCallback(this.isReady && this.partnerReady);
            }
          } else if (this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        }
      })
      .subscribe((status) => {
        console.log("Signaling channel status:", status);
        if (status === 'SUBSCRIBED') {
          // Send ready signal once subscribed
          setTimeout(() => {
            this.sendReadySignal();
          }, 1000);
        }
      });

    return () => {
      console.log("Cleaning up signaling channel");
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  private async sendReadySignal(): Promise<void> {
    this.isReady = true;
    console.log("Sending ready signal");
    await this.sendMessage('ready', { ready: true });
    
    if (this.onReadyStateChangeCallback) {
      this.onReadyStateChangeCallback(this.isReady && this.partnerReady);
    }
  }

  async sendMessage(messageType: SignalingMessage['message_type'], messageData: any): Promise<void> {
    if (!this.roomCode || !this.userEmail || !this.partnerEmail || !this.channel) {
      throw new Error('Signaling not initialized');
    }

    const message: SignalingMessage = {
      room_code: this.roomCode,
      sender_email: this.userEmail,
      recipient_email: this.partnerEmail,
      message_type: messageType,
      message_data: messageData,
      created_at: new Date().toISOString()
    };

    console.log('Sending signaling message:', messageType, messageData);
    
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

  onReadyStateChange(callback: (bothReady: boolean) => void): void {
    this.onReadyStateChangeCallback = callback;
  }

  areBothReady(): boolean {
    return this.isReady && this.partnerReady;
  }

  cleanup(): void {
    console.log("Cleaning up signaling service");
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.roomCode = null;
    this.userEmail = null;
    this.partnerEmail = null;
    this.onMessageCallback = null;
    this.onReadyStateChangeCallback = null;
    this.isReady = false;
    this.partnerReady = false;
  }
}

export const signalingService = new SignalingService();
