import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RaceDisplay } from '../components/RaceDisplay';
import { Race } from '../lib/types';
import { RaceConfig } from '../components/RaceSetup';

export const RacePage = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<Race | null>(null);
  const [config, setConfig] = useState<RaceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!raceId) {
      navigate('/');
      return;
    }

    loadRace();
  }, [raceId]);

  const loadRace = async () => {
    if (!raceId) return;

    const { data } = await supabase
      .from('races')
      .select('*')
      .eq('id', raceId)
      .single();

    if (data) {
      setRace(data);
      setConfig({
        name: data.name,
        mode: data.mode,
        targetCadence: data.target_cadence,
        cadenceTolerance: data.cadence_tolerance,
        participants: [],
      });
    }
    setLoading(false);
  };

  const handleRaceComplete = async () => {
    if (!raceId) return;
    navigate(`/results/${raceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-bold text-green-400 font-mono animate-pulse">
          LOADING RACE...
        </div>
      </div>
    );
  }

  if (!race || !config || !raceId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-400 font-mono mb-4">
            RACE NOT FOUND
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-green-500 text-black font-mono font-bold rounded"
          >
            RETOUR À L'ACCUEIL
          </button>
        </div>
      </div>
    );
  }

  return (
    <RaceDisplay
      raceId={raceId}
      config={config}
      onRaceComplete={handleRaceComplete}
      onOpenAdmin={() => navigate(`/admin/${raceId}`)}
    />
  );
};
