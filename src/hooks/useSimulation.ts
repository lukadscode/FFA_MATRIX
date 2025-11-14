import { useEffect, useRef } from 'react';
import { PM5Data } from './useErgRaceWebSocket';

type SimulationConfig = {
  participantCount: number;
  targetCadence: number;
  tolerance: number;
  onData: (data: PM5Data, participantIndex: number) => void;
};

export const useSimulation = ({ participantCount, targetCadence, tolerance, onData }: SimulationConfig) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const participantStates = useRef<Array<{
    distance: number;
    cadence: number;
    trend: number;
  }>>([]);

  useEffect(() => {
    participantStates.current = Array.from({ length: participantCount }, () => ({
      distance: 0,
      cadence: targetCadence + Math.floor(Math.random() * (tolerance * 2)) - tolerance,
      trend: 0,
    }));

    intervalRef.current = setInterval(() => {
      participantStates.current.forEach((state, index) => {
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
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [participantCount, targetCadence, tolerance, onData]);

  const connectionStates = Array(participantCount).fill('CONNECTED');

  return { connectionStates };
};
