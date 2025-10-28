import { useNavigate } from 'react-router-dom';
import { RaceSetup, RaceConfig } from '../components/RaceSetup';
import { useSyncServer } from '../hooks/useSyncServer';

const SYNC_SERVER_URL = 'ws://localhost:8080';

export const SetupPage = () => {
  const navigate = useNavigate();
  const { send } = useSyncServer(SYNC_SERVER_URL);

  const handleStartRace = (config: RaceConfig) => {
    const raceId = crypto.randomUUID();

    const raceData = {
      id: raceId,
      name: config.name,
      mode: config.mode,
      target_cadence: config.targetCadence,
      cadence_tolerance: config.cadenceTolerance,
      duration_seconds: 300,
      status: 'active',
      started_at: new Date().toISOString(),
      participants: config.participants.map((p, index) => ({
        id: crypto.randomUUID(),
        name: p.name,
        teamId: p.teamId,
        index,
      })),
    };

    sessionStorage.setItem('currentRace', JSON.stringify(raceData));

    send({ type: 'create_race', data: raceData });

    raceData.participants.forEach((participant) => {
      send({ type: 'add_participant', data: participant });
    });

    navigate(`/race/${raceId}`);
  };

  return <RaceSetup onStartRace={handleStartRace} />;
};
