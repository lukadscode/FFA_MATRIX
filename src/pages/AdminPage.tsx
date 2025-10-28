import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminControl } from '../components/AdminControl';
import { Race } from '../lib/types';

export const AdminPage = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!raceId) {
      navigate('/');
      return;
    }

    loadRace();
  }, [raceId]);

  const loadRace = () => {
    if (!raceId) return;

    const raceDataStr = sessionStorage.getItem('currentRace');
    if (!raceDataStr) {
      navigate('/');
      return;
    }

    const raceData = JSON.parse(raceDataStr);
    if (raceData.id === raceId) {
      setRace({
        id: raceData.id,
        name: raceData.name,
        mode: raceData.mode,
        target_cadence: raceData.target_cadence,
        cadence_tolerance: raceData.cadence_tolerance,
        duration_seconds: raceData.duration_seconds,
        status: raceData.status,
        started_at: raceData.started_at,
        ended_at: null,
        last_cadence_change: null,
        created_at: raceData.started_at,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-bold text-green-400 font-mono animate-pulse">
          LOADING...
        </div>
      </div>
    );
  }

  if (!race || !raceId) {
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

  const handleEndRace = () => {
    navigate(`/results/${raceId}`);
  };

  return (
    <AdminControl
      raceId={raceId}
      raceName={race.name}
      onBack={() => navigate(`/race/${raceId}`)}
      onEndRace={handleEndRace}
    />
  );
};
