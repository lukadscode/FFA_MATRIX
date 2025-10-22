import { useEffect, useRef, useCallback, useState } from 'react';

export type PM5Data = {
  cadence?: number;
  distance?: number;
  time?: number;
  power?: number;
};

type OnDataCallback = (data: PM5Data, participantIndex: number) => void;

export const useErgRaceWebSocket = (
  participantCount: number,
  onData: OnDataCallback,
  isActive: boolean
) => {
  const websocketsRef = useRef<WebSocket[]>([]);
  const [connectionStates, setConnectionStates] = useState<string[]>(
    Array(participantCount).fill('DISCONNECTED')
  );

  const parseErgRaceMessage = useCallback((message: string): PM5Data | null => {
    try {
      const data = JSON.parse(message);

      if (data.SPM !== undefined) {
        return {
          cadence: parseInt(data.SPM),
          distance: data.Distance ? parseInt(data.Distance) : undefined,
          time: data.Time ? parseInt(data.Time) : undefined,
          power: data.Watts ? parseInt(data.Watts) : undefined,
        };
      }

      return null;
    } catch {
      return null;
    }
  }, []);

  const connectWebSocket = useCallback((index: number, port: number = 443 + index) => {
    try {
      const wsUri = `ws://localhost:${port}`;
      const ws = new WebSocket(wsUri);

      ws.onopen = () => {
        setConnectionStates(prev => {
          const newStates = [...prev];
          newStates[index] = 'CONNECTED';
          return newStates;
        });
      };

      ws.onclose = () => {
        setConnectionStates(prev => {
          const newStates = [...prev];
          newStates[index] = 'DISCONNECTED';
          return newStates;
        });
      };

      ws.onmessage = (evt) => {
        const parsedData = parseErgRaceMessage(evt.data);
        if (parsedData && parsedData.cadence !== undefined) {
          onData(parsedData, index);
        }
      };

      ws.onerror = () => {
        setConnectionStates(prev => {
          const newStates = [...prev];
          newStates[index] = 'ERROR';
          return newStates;
        });
      };

      websocketsRef.current[index] = ws;
    } catch (error) {
      console.error(`Error connecting WebSocket ${index}:`, error);
      setConnectionStates(prev => {
        const newStates = [...prev];
        newStates[index] = 'ERROR';
        return newStates;
      });
    }
  }, [onData, parseErgRaceMessage]);

  useEffect(() => {
    if (!isActive) return;

    for (let i = 0; i < participantCount; i++) {
      connectWebSocket(i);
    }

    return () => {
      websocketsRef.current.forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      websocketsRef.current = [];
    };
  }, [participantCount, isActive, connectWebSocket]);

  const reconnect = useCallback((index: number) => {
    const ws = websocketsRef.current[index];
    if (ws) {
      ws.close();
    }
    setTimeout(() => connectWebSocket(index), 500);
  }, [connectWebSocket]);

  return {
    connectionStates,
    reconnect,
  };
};
