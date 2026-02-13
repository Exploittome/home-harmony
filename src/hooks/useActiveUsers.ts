import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveUsersStats {
  onlineNow: number;
  todayVisitors: number;
  isLoading: boolean;
}

export const useActiveUsers = (userEmail: string | null) => {
  const [stats, setStats] = useState<ActiveUsersStats>({
    onlineNow: 0,
    todayVisitors: 0,
    isLoading: true,
  });

  const adminEmails = ['exploittome@gmail.com', 'lmessigo@gmail.com'];
  const isAdmin = userEmail ? adminEmails.includes(userEmail) : false;

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
    // Fetch stats only for admin
    if (isAdmin) {
      fetchStats();
      const statsInterval = setInterval(fetchStats, 60000); // Update stats every minute
      return () => clearInterval(statsInterval);
    } else {
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAdmin, fetchStats]);

  return { stats, isAdmin };
};
