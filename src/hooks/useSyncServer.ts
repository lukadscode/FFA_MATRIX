import { useEffect, useRef, useCallback } from 'react';

type SyncMessage = {
  type: string;
  data?: unknown;
  raceId?: string;
};

type MessageHandler = (message: SyncMessage) => void;

export const useSyncServer = (
  serverUrl: string,
  onMessage?: MessageHandler
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(serverUrl);

      ws.onopen = () => {
        console.log('✅ Connected to Sync Server');
        isConnectedRef.current = true;
        ws.send(JSON.stringify({ type: 'get_state' }));
      };

      ws.onclose = () => {
        console.log('❌ Disconnected from Sync Server');
        isConnectedRef.current = false;
        reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
      };

      ws.onerror = (error) => {
        console.error('Sync Server error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing sync message:', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to Sync Server:', error);
      reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
    }
  }, [serverUrl, onMessage]);

  const send = useCallback((message: SyncMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { send, isConnected: isConnectedRef.current };
};
