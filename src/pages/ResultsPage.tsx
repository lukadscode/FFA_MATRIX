import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RaceResults } from '../components/RaceResults';
import { Participant, Race } from '../lib/types';
import { wsClient } from '../lib/websocket';

export const ResultsPage = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!raceId) {
      navigate('/');
      return;
    }

    loadResults();
  }, [raceId]);

  const loadResults = async () => {
    if (!raceId) return;

    const [raceData, participantsData] = await Promise.all([
      wsClient.getRace(raceId),
      wsClient.getParticipants(raceId),
    ]);

    if (raceData) {
      setRace(raceData);
    }
    if (participantsData) {
      setParticipants(participantsData);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-bold text-green-400 font-mono animate-pulse">
          LOADING RESULTS...
        </div>
      </div>
    );
  }

  if (!race) {
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
    <RaceResults
      participants={participants}
      mode={race.mode}
      race={race}
      onNewRace={() => navigate('/')}
    />
  );
};
