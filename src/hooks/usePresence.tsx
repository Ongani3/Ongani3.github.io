import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPresence } from '@/utils/CallManager';
import { useToast } from '@/hooks/use-toast';

export const usePresence = (userType: 'customer' | 'admin') => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [currentUserPresence, setCurrentUserPresence] = useState<UserPresence | null>(null);
  const { toast } = useToast();

  // Update user presence
  const updatePresence = useCallback(async (status: UserPresence['status']) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          user_type: userType,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentUserPresence(data as UserPresence);
    } catch (error) {
      console.error('Failed to update presence:', error);
      // Don't show toast for presence errors as they're too frequent
    }
  }, [userType]);

  // Fetch all online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('status', 'online');

      if (error) throw error;
      setOnlineUsers((data as UserPresence[]) || []);
    } catch (error) {
      console.error('Failed to fetch online users:', error);
    }
  }, []);

  // Set up real-time presence tracking
  useEffect(() => {
    const initializePresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Set initial presence to online
    updatePresence('online');

    // Set up real-time subscription
    const presenceChannel = supabase
      .channel('user-presence')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence'
      }, (payload) => {
        console.log('Presence update:', payload);
        fetchOnlineUsers();
      })
      .subscribe();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    // Handle beforeunload to set offline status
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Fetch initial online users
    fetchOnlineUsers();

    return () => {
      // Cleanup
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      supabase.removeChannel(presenceChannel);
      
      // Set offline status when component unmounts
      updatePresence('offline');
    };
    };

    initializePresence();
  }, [updatePresence, fetchOnlineUsers]);

  // Heartbeat to maintain online status
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (currentUserPresence?.status === 'online') {
        updatePresence('online');
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(heartbeat);
  }, [currentUserPresence, updatePresence]);

  return {
    onlineUsers,
    currentUserPresence,
    updatePresence,
    fetchOnlineUsers
  };
};