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

  const parseErgRaceMessage = useCallback((message: string): Array<PM5Data | null> => {
    try {
      if (!message || message === '{}') return [];

      const data = JSON.parse(message);

      if (data.race_data && data.race_data.data) {
        const results: Array<PM5Data | null> = [];
        for (let i = 0; i < participantCount; i++) {
          const laneData = data.race_data.data.find((d: { lane: number }) => d.lane === i + 1);
          if (laneData && laneData.spm !== undefined) {
            results[i] = {
              cadence: parseInt(laneData.spm),
              distance: laneData.meters ? parseInt(laneData.meters) : undefined,
              time: laneData.time ? parseInt(laneData.time) : undefined,
              power: laneData.watts ? parseInt(laneData.watts) : undefined,
            };
          } else {
            results[i] = null;
          }
        }
        return results;
      }

      if (data.SPM !== undefined) {
        return [
          {
            cadence: parseInt(data.SPM),
            distance: data.Distance ? parseInt(data.Distance) : undefined,
            time: data.Time ? parseInt(data.Time) : undefined,
            power: data.Watts ? parseInt(data.Watts) : undefined,
          }
        ];
      }

      return [];
    } catch {
      return [];
    }
  }, [participantCount]);

  const connectWebSocket = useCallback(() => {
    try {
      const wsUri = `ws://localhost:443`;
      const ws = new WebSocket(wsUri);

      ws.onopen = () => {
        setConnectionStates(Array(participantCount).fill('CONNECTED'));
      };

      ws.onclose = () => {
        setConnectionStates(Array(participantCount).fill('DISCONNECTED'));
      };

      ws.onmessage = (evt) => {
        const parsedDataArray = parseErgRaceMessage(evt.data);
        parsedDataArray.forEach((parsedData, index) => {
          if (parsedData && parsedData.cadence !== undefined) {
            onData(parsedData, index);
          }
        });
      };

      ws.onerror = () => {
        setConnectionStates(Array(participantCount).fill('ERROR'));
      };

      websocketsRef.current[0] = ws;
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      setConnectionStates(Array(participantCount).fill('ERROR'));
    }
  }, [participantCount, onData, parseErgRaceMessage]);

  useEffect(() => {
    if (!isActive) return;

    connectWebSocket();

    return () => {
      websocketsRef.current.forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      websocketsRef.current = [];
    };
  }, [participantCount, isActive, connectWebSocket]);

  const reconnect = useCallback(() => {
    const ws = websocketsRef.current[0];
    if (ws) {
      ws.close();
    }
    setTimeout(() => connectWebSocket(), 500);
  }, [connectWebSocket]);

  return {
    connectionStates,
    reconnect,
  };
};
