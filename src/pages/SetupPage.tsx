import { useNavigate } from 'react-router-dom';
import { RaceSetup, RaceConfig } from '../components/RaceSetup';
import { supabase } from '../lib/supabase';

export const SetupPage = () => {
  const navigate = useNavigate();

  const handleStartRace = async (config: RaceConfig) => {
    const { data: race } = await supabase
      .from('races')
      .insert({
        name: config.name,
        mode: config.mode,
        target_cadence: config.targetCadence,
        cadence_tolerance: config.cadenceTolerance,
        duration_seconds: 300,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!race) return;

    const participantsToInsert = config.participants.map((p) => ({
      race_id: race.id,
      name: p.name,
      team_id: p.teamId || null,
      total_distance_in_cadence: 0,
      current_cadence: 0,
      is_in_cadence: false,
    }));

    await supabase.from('participants').insert(participantsToInsert);

    navigate(`/race/${race.id}`);
  };

  return <RaceSetup onStartRace={handleStartRace} />;
};
