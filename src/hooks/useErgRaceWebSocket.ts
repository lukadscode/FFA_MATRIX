import { useEffect, useRef, useCallback, useState } from 'react';
import { Participant } from '../lib/types';

export type PM5Data = {
  cadence?: number;
  distance?: number;
  time?: number;
  power?: number;
  timestamp?: number;
};

type OnDataCallback = (data: PM5Data, participantIndex: number) => void;

const LED_WS_URL = 'ws://leds-ws-server.under-code.fr:8081';
const LED_GAME_NAME = 'nomatrouver';

export const useErgRaceWebSocket = (
  participantCount: number,
  onData: OnDataCallback,
  isActive: boolean,
  participants: Participant[] = [],
  targetCadence: number = 20,
  tolerance: number = 2
) => {
  const websocketsRef = useRef<WebSocket[]>([]);
  const ledWsRef = useRef<WebSocket | null>(null);
  const participantsRef = useRef<Participant[]>(participants);
  const [connectionStates, setConnectionStates] = useState<string[]>(
    Array(participantCount).fill('DISCONNECTED')
  );

  // Mettre à jour la ref des participants
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

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

        // Envoyer les données aux LEDs en utilisant les données reçues directement
        if (ledWsRef.current?.readyState === WebSocket.OPEN) {
          const players = parsedDataArray.map((parsedData, index) => {
            const participant = participantsRef.current[index];
            const cadence = parsedData?.cadence || participant?.current_cadence || 0;
            const isInCadence =
              cadence >= (targetCadence - tolerance) &&
              cadence <= (targetCadence + tolerance);

            return {
              id: index + 1,
              rate: cadence,
              'target-rate': isInCadence,
              distance: participant?.total_distance_in_cadence || 0
            };
          });

          const gameData = {
            type: 'send_game_data',
            payload: {
              game: LED_GAME_NAME,
              players: players
            }
          };
          ledWsRef.current.send(JSON.stringify(gameData));
        }
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

    // Connexion au serveur WebSocket des LEDs
    ledWsRef.current = new WebSocket(LED_WS_URL);

    ledWsRef.current.onopen = () => {
      console.log('✅ ErgRace: Connecté au serveur WebSocket pour LEDs');
    };

    ledWsRef.current.onerror = (error) => {
      console.error('❌ ErgRace: Erreur WebSocket LEDs:', error);
    };

    ledWsRef.current.onclose = () => {
      console.log('❌ ErgRace: Déconnecté du serveur WebSocket LEDs');
    };

    connectWebSocket();

    return () => {
      websocketsRef.current.forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      websocketsRef.current = [];

      if (ledWsRef.current) {
        ledWsRef.current.close();
      }
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
