import { useNavigate } from 'react-router-dom';
import { RaceSetup, RaceConfig } from '../components/RaceSetup';

export const SetupPage = () => {
  const navigate = useNavigate();

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
    navigate(`/race/${raceId}`);
  };

  return <RaceSetup onStartRace={handleStartRace} />;
};
