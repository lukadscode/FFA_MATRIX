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
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStates, setConnectionStates] = useState<string[]>(
    Array(participantCount).fill('DISCONNECTED')
  );

  const parseErgRaceMessage = useCallback((message: string): void => {
    try {
      if (!message || message === '{}') return;

      const data = JSON.parse(message);

      if (data.race_data && data.race_data.data) {
        data.race_data.data.forEach((laneData: { lane: number; spm: number; meters?: number; time?: number; watts?: number }) => {
          if (laneData.spm !== undefined) {
            const participantIndex = laneData.lane - 1;

            if (participantIndex >= 0 && participantIndex < participantCount) {
              onData(
                {
                  cadence: parseInt(String(laneData.spm)),
                  distance: laneData.meters ? parseInt(String(laneData.meters)) : undefined,
                  time: laneData.time ? parseInt(String(laneData.time)) : undefined,
                  power: laneData.watts ? parseInt(String(laneData.watts)) : undefined,
                },
                participantIndex
              );
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing ErgRace message:', error);
    }
  }, [onData, participantCount]);

  const connectWebSocket = useCallback(() => {
    if (!isActive) return;

    try {
      const ws = new WebSocket('ws://localhost:443');

      ws.onopen = () => {
        console.log('✅ Connected to ErgRace on port 443');
        setConnectionStates(Array(participantCount).fill('CONNECTED'));
      };

      ws.onclose = () => {
        console.log('❌ Disconnected from ErgRace');
        setConnectionStates(Array(participantCount).fill('DISCONNECTED'));

        if (isActive) {
          setTimeout(connectWebSocket, 2000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ ErgRace WebSocket error:', error);
        setConnectionStates(Array(participantCount).fill('ERROR'));
      };

      ws.onmessage = (evt) => {
        parseErgRaceMessage(evt.data);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting to ErgRace WebSocket:', error);
      setConnectionStates(Array(participantCount).fill('ERROR'));

      if (isActive) {
        setTimeout(connectWebSocket, 2000);
      }
    }
  }, [isActive, participantCount, parseErgRaceMessage]);

  useEffect(() => {
    if (isActive && participantCount > 0) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [participantCount, isActive, connectWebSocket]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setTimeout(connectWebSocket, 500);
  }, [connectWebSocket]);

  return {
    connectionStates,
    reconnect,
  };
};
