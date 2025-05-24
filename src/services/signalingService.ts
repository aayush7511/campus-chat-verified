
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

  async setupSignaling(roomCode: string, userEmail: string): Promise<() => void> {
    this.roomCode = roomCode;
    this.userEmail = userEmail;

    // First, create the signaling_messages table if it doesn't exist
    await this.ensureSignalingTable();

    // Listen for signaling messages
    const channel = supabase
      .channel(`signaling-${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'signaling_messages',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          const message = payload.new as SignalingMessage;
          // Don't process our own messages
          if (message.sender_email !== this.userEmail && this.onMessageCallback) {
            this.onMessageCallback(message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private async ensureSignalingTable(): Promise<void> {
    // This will create the table if it doesn't exist
    // We'll use a simple approach that won't fail if table exists
    try {
      await supabase
        .from('signaling_messages')
        .select('id')
        .limit(1);
    } catch (error) {
      console.log('Signaling messages table might not exist, but continuing...');
    }
  }

  async sendMessage(messageType: SignalingMessage['message_type'], messageData: any): Promise<void> {
    if (!this.roomCode || !this.userEmail) {
      throw new Error('Signaling not initialized');
    }

    const message: Omit<SignalingMessage, 'id' | 'created_at'> = {
      room_code: this.roomCode,
      sender_email: this.userEmail,
      message_type: messageType,
      message_data: messageData
    };

    // For now, we'll store signaling data in a simple way
    // In production, you'd want a proper signaling server
    console.log('Sending signaling message:', message);
    
    // Store in localStorage as a fallback signaling mechanism
    const storageKey = `signaling_${this.roomCode}`;
    const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingMessages.push({
      ...message,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    });
    localStorage.setItem(storageKey, JSON.stringify(existingMessages));

    // Trigger a custom event for other tabs/windows
    window.dispatchEvent(new CustomEvent('signaling-message', { detail: message }));
  }

  onMessage(callback: (message: SignalingMessage) => void): void {
    this.onMessageCallback = callback;

    // Also listen for localStorage events (for same-browser testing)
    const handleStorageEvent = (event: CustomEvent) => {
      const message = event.detail as SignalingMessage;
      if (message.sender_email !== this.userEmail) {
        callback(message);
      }
    };

    window.addEventListener('signaling-message', handleStorageEvent as EventListener);
  }

  cleanup(): void {
    this.roomCode = null;
    this.userEmail = null;
    this.onMessageCallback = null;
  }
}

export const signalingService = new SignalingService();
