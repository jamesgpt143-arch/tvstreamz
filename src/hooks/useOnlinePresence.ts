import { useEffect, useState } from 'react';
import { database } from '@/integrations/firebase/client';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

export function useOnlinePresence() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    try {
      // Generate or retrieve session ID
      let sessionId = sessionStorage.getItem('presence_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('presence_id', sessionId);
      }

      const presenceRef = ref(database, `presence/${sessionId}`);
      const connectedRef = ref(database, '.info/connected');
      const allPresenceRef = ref(database, 'presence');

      // Track connection status
      const unsubConnected = onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === true) {
          // We're connected, set our presence
          set(presenceRef, {
            online: true,
            lastSeen: serverTimestamp()
          }).catch(e => console.warn('Firebase presence set failed', e));

          // Remove presence on disconnect
          onDisconnect(presenceRef).remove().catch(e => console.warn('Firebase onDisconnect failed', e));
        }
      });

      // Listen to total online users
      const unsubPresence = onValue(allPresenceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setOnlineCount(Object.keys(data).length);
        } else {
          setOnlineCount(0);
        }
      });

      return () => {
        unsubConnected();
        unsubPresence();
      };
    } catch (e) {
      console.warn("Firebase useOnlinePresence error", e);
      return () => {};
    }
  }, []);

  return onlineCount;
}
