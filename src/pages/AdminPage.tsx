import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminControl } from '../components/AdminControl';
import { Race } from '../lib/types';
import { wsClient } from '../lib/websocket';

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

  const loadRace = async () => {
    if (!raceId) return;

    const data = await wsClient.getRace(raceId);

    if (data) {
      setRace(data);
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

  return (
    <AdminControl
      raceId={raceId}
      raceName={race.name}
      onBack={() => navigate(`/race/${raceId}`)}
    />
  );
};
