import { useState, useEffect, useRef } from 'react';

export type RaceDefinition = {
  boats: Array<{
    lane_number: number;
    name: string;
    machine_type: string;
    affiliation?: string;
    class_name?: string;
  }>;
  event_name: string;
  name_long: string;
  race_type: 'individual' | 'relay';
  duration: number;
  duration_type: 'time' | 'distance';
};

export type RaceStatus = {
  state: number;
  state_desc: string;
  controller_offline: string;
  data?: Array<{ lane?: number }>;
};

export type RaceData = {
  data: Array<{
    lane: number;
    spm: number;
    meters: number;
    time: number;
    watts: number;
    pace: number;
    calories_per_hour: number;
    position: number;
  }>;
  time: number;
};

export const useErgRaceStatus = () => {
  const [raceDefinition, setRaceDefinition] = useState<RaceDefinition | null>(null);
  const [raceStatus, setRaceStatus] = useState<RaceStatus | null>(null);
  const [raceData, setRaceData] = useState<RaceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectToErgRace = () => {
      try {
        const ws = new WebSocket('ws://localhost:443');

        ws.onopen = () => {
          console.log('✅ Connected to ErgRace status on port 443');
          setIsConnected(true);
        };

        ws.onclose = () => {
          console.log('❌ Disconnected from ErgRace status');
          setIsConnected(false);
          setTimeout(connectToErgRace, 2000);
        };

        ws.onerror = (error) => {
          console.error('❌ ErgRace status connection error:', error);
          setIsConnected(false);
        };

        ws.onmessage = (evt) => {
          try {
            if (!evt.data || evt.data === '{}') return;

            const message = JSON.parse(evt.data);

            if (message.race_definition) {
              console.log('📋 Race definition received:', message.race_definition);
              setRaceDefinition(message.race_definition);
            }

            if (message.race_status) {
              console.log('🏁 Race status:', message.race_status.state_desc);
              setRaceStatus(message.race_status);
            }

            if (message.race_data) {
              setRaceData(message.race_data);
            }
          } catch (error) {
            console.error('Error parsing ErgRace message:', error);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect to ErgRace status:', error);
        setTimeout(connectToErgRace, 2000);
      }
    };

    connectToErgRace();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    raceDefinition,
    raceStatus,
    raceData,
    isConnected,
  };
};
