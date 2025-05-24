
import { supabase } from "@/integrations/supabase/client";

export interface ActiveUser {
  id: string;
  user_email: string;
  joined_at: string;
  is_matched: boolean;
  room_id: string | null;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  room_code: string;
  user1_email: string;
  user2_email: string;
  created_at: string;
  ended_at: string | null;
  is_active: boolean;
}

class MatchingService {
  private userEmail: string = '';
  private currentUserId: string | null = null;
  private onMatchFoundCallback: ((roomCode: string, partnerEmail: string) => void) | null = null;

  async joinQueue(userEmail: string): Promise<string> {
    this.userEmail = userEmail;
    
    // Remove any existing entries for this user
    await this.leaveQueue();
    
    // Add user to active_users table
    const { data: userData, error: userError } = await supabase
      .from('active_users')
      .insert({
        user_email: userEmail,
        is_matched: false
      })
      .select()
      .single();

    if (userError) {
      console.error('Error joining queue:', userError);
      throw userError;
    }

    this.currentUserId = userData.id;
    
    // Look for an available partner
    await this.findMatch();
    
    return userData.id;
  }

  async findMatch(): Promise<void> {
    // Find another unmatched user (excluding current user)
    const { data: availableUsers, error } = await supabase
      .from('active_users')
      .select('*')
      .eq('is_matched', false)
      .neq('user_email', this.userEmail)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error finding match:', error);
      return;
    }

    if (availableUsers && availableUsers.length > 0) {
      const partner = availableUsers[0];
      await this.createMatch(partner);
    }
  }

  private async createMatch(partner: ActiveUser): Promise<void> {
    const roomCode = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create chat room
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        room_code: roomCode,
        user1_email: this.userEmail,
        user2_email: partner.user_email,
        is_active: true
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creating room:', roomError);
      return;
    }

    // Update both users as matched
    await Promise.all([
      supabase
        .from('active_users')
        .update({ is_matched: true, room_id: roomCode })
        .eq('id', this.currentUserId),
      supabase
        .from('active_users')
        .update({ is_matched: true, room_id: roomCode })
        .eq('id', partner.id)
    ]);

    // Notify about the match
    if (this.onMatchFoundCallback) {
      this.onMatchFoundCallback(roomCode, partner.user_email);
    }
  }

  async leaveQueue(): Promise<void> {
    if (this.currentUserId) {
      await supabase
        .from('active_users')
        .delete()
        .eq('id', this.currentUserId);
      
      this.currentUserId = null;
    } else if (this.userEmail) {
      // Fallback: delete by email
      await supabase
        .from('active_users')
        .delete()
        .eq('user_email', this.userEmail);
    }
  }

  async endCurrentRoom(): Promise<void> {
    if (this.currentUserId) {
      // Get current user's room
      const { data: userData } = await supabase
        .from('active_users')
        .select('room_id')
        .eq('id', this.currentUserId)
        .single();

      if (userData?.room_id) {
        // Mark room as inactive
        await supabase
          .from('chat_rooms')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('room_code', userData.room_id);
      }

      // Remove from active users
      await this.leaveQueue();
    }
  }

  setupRealtimeListeners(onMatchFound: (roomCode: string, partnerEmail: string) => void): () => void {
    this.onMatchFoundCallback = onMatchFound;

    // Listen for updates to active_users table
    const channel = supabase
      .channel('matching-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_users',
          filter: `user_email=eq.${this.userEmail}`
        },
        (payload) => {
          const updatedUser = payload.new as ActiveUser;
          if (updatedUser.is_matched && updatedUser.room_id) {
            // Find partner email from the room
            this.getPartnerFromRoom(updatedUser.room_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private async getPartnerFromRoom(roomCode: string): Promise<void> {
    const { data: roomData } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (roomData) {
      const partnerEmail = roomData.user1_email === this.userEmail 
        ? roomData.user2_email 
        : roomData.user1_email;
      
      if (this.onMatchFoundCallback) {
        this.onMatchFoundCallback(roomCode, partnerEmail);
      }
    }
  }

  async getActiveUsersCount(): Promise<number> {
    const { count } = await supabase
      .from('active_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_matched', false);
    
    return count || 0;
  }
}

export const matchingService = new MatchingService();
