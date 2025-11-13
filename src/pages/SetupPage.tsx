import { useNavigate } from 'react-router-dom';
import { RaceSetup, RaceConfig } from '../components/RaceSetup';
import { wsClient } from '../lib/websocket';

export const SetupPage = () => {
  const navigate = useNavigate();

  const handleStartRace = async (config: RaceConfig) => {
    const race = await wsClient.createRace({
      name: config.name,
      mode: config.mode,
      target_cadence: config.targetCadence,
      cadence_tolerance: config.cadenceTolerance,
      duration_seconds: 300,
      status: 'active',
      started_at: new Date().toISOString(),
      ended_at: null,
      last_cadence_change: null,
      simulation_mode: config.simulationMode,
    });

    if (!race) return;

    for (const p of config.participants) {
      await wsClient.createParticipant({
        race_id: race.id,
        name: p.name,
        team_id: p.teamId || null,
        ws_connection_id: null,
        total_distance_in_cadence: 0,
        current_cadence: 0,
        is_in_cadence: false,
      });
    }

    navigate(`/race/${race.id}`);
  };

  return <RaceSetup onStartRace={handleStartRace} />;
};
