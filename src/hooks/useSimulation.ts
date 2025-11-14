import { useEffect, useRef } from 'react';
import { PM5Data } from './useErgRaceWebSocket';

type SimulationConfig = {
  participantCount: number;
  targetCadence: number;
  tolerance: number;
  onData: (data: PM5Data, participantIndex: number) => void;
};

const WS_HOST = import.meta.env.VITE_WS_HOST || 'localhost';
const LED_WS_URL = `ws://${WS_HOST}:8081`;

export const useSimulation = ({ participantCount, targetCadence, tolerance, onData }: SimulationConfig) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const participantStates = useRef<Array<{
    distance: number;
    cadence: number;
    trend: number;
  }>>([]);

  useEffect(() => {
    // Connexion au serveur WebSocket pour forward aux LEDs
    wsRef.current = new WebSocket(LED_WS_URL);

    wsRef.current.onopen = () => {
      console.log('✅ Mode Simulation: Connecté au serveur WebSocket pour LEDs');
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ Mode Simulation: Erreur WebSocket:', error);
    };

    wsRef.current.onclose = () => {
      console.log('❌ Mode Simulation: Déconnecté du serveur WebSocket');
    };

    participantStates.current = Array.from({ length: participantCount }, () => ({
      distance: 0,
      cadence: targetCadence + Math.floor(Math.random() * (tolerance * 2 + 1)) - tolerance,
      trend: 0,
    }));

    intervalRef.current = setInterval(() => {
      const players = participantStates.current.map((state, index) => {
        const randomVariation = Math.random() * 4 - 2;
        state.cadence = Math.max(10, Math.min(40, state.cadence + randomVariation));

        const strokeDistance = Math.floor(8 + Math.random() * 4);
        state.distance += strokeDistance;

        const pm5Data: PM5Data = {
          cadence: Math.round(state.cadence),
          distance: state.distance,
          timestamp: Date.now(),
        };

        onData(pm5Data, index);

        // Calculer si le participant est dans la cadence cible
        const isInCadence =
          pm5Data.cadence >= (targetCadence - tolerance) &&
          pm5Data.cadence <= (targetCadence + tolerance);

        return {
          id: index + 1,
          rate: pm5Data.cadence,
          'target-rate': isInCadence,
          distance: state.distance
        };
      });

      // Envoi des données au serveur WebSocket dans le même format que send_game_data
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const gameData = {
          type: 'send_game_data',
          payload: {
            game: 'nomatrouver',
            players: players
          }
        };
        wsRef.current.send(JSON.stringify(gameData));
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [participantCount, targetCadence, tolerance, onData]);

  const connectionStates = Array(participantCount).fill('CONNECTED');

  return { connectionStates };
};
