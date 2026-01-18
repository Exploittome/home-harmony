import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveUsersStats {
  onlineNow: number;
  todayVisitors: number;
  isLoading: boolean;
}

// Generate or get persistent session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('app_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('app_session_id', sessionId);
  }
  return sessionId;
};

export const useActiveUsers = (userEmail: string | null) => {
  const [stats, setStats] = useState<ActiveUsersStats>({
    onlineNow: 0,
    todayVisitors: 0,
    isLoading: true,
  });

  const isAdmin = userEmail === 'exploittome@gmail.com';

  // Update session heartbeat
  const updateHeartbeat = useCallback(async () => {
    const sessionId = getSessionId();
    const { data: { user } } = await supabase.auth.getUser();
    
    try {
      // First try to update existing session
      const { data: updated, error: updateError } = await supabase
        .from('user_sessions')
        .update({ 
          last_seen: new Date().toISOString(),
          user_id: user?.id || null,
        })
        .eq('session_id', sessionId)
        .select('id');

      // If no row was updated, insert a new session
      if (!updated || updated.length === 0) {
        await supabase
          .from('user_sessions')
          .insert({
            session_id: sessionId,
            user_id: user?.id || null,
            last_seen: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, []);

  // Fetch stats (only for admin)
  const fetchStats = useCallback(async () => {
    if (!isAdmin) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Count online users (active in last 5 minutes)
      const { count: onlineCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinutesAgo.toISOString());

      // Count today's unique visitors (sessions active today)
      const { count: todayCount } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', todayStart.toISOString());

      setStats({
        onlineNow: onlineCount || 0,
        todayVisitors: todayCount || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching active users stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAdmin]);

  useEffect(() => {
    // Always update heartbeat for all users
    updateHeartbeat();

    // Set up heartbeat interval (every 30 seconds)
    const heartbeatInterval = setInterval(updateHeartbeat, 30000);

    // Fetch stats only for admin
    if (isAdmin) {
      fetchStats();
      const statsInterval = setInterval(fetchStats, 60000); // Update stats every minute
      return () => {
        clearInterval(heartbeatInterval);
        clearInterval(statsInterval);
      };
    }

    return () => clearInterval(heartbeatInterval);
  }, [isAdmin, updateHeartbeat, fetchStats]);

  return { stats, isAdmin };
};
