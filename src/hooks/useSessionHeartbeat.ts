import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate or get persistent session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('app_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('app_session_id', sessionId);
  }
  return sessionId;
};

export const useSessionHeartbeat = () => {
  const updateHeartbeat = useCallback(async () => {
    const sessionId = getSessionId();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // First try to update existing session
      const { data: updated } = await supabase
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
      console.error('Session heartbeat error:', error);
    }
  }, []);

  useEffect(() => {
    // Send heartbeat immediately on mount
    updateHeartbeat();

    // Set up heartbeat interval (every 30 seconds)
    const heartbeatInterval = setInterval(updateHeartbeat, 30000);

    // Update heartbeat when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateHeartbeat]);
};
