import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RaceResults } from '../components/RaceResults';
import { Participant } from '../lib/types';

export const ResultsPage = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mode, setMode] = useState<'solo' | 'team'>('solo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!raceId) {
      navigate('/');
      return;
    }

    loadResults();
  }, [raceId]);

  const loadResults = () => {
    if (!raceId) return;

    const resultsStr = sessionStorage.getItem('raceResults');
    if (!resultsStr) {
      navigate('/');
      return;
    }

    const results = JSON.parse(resultsStr);
    if (results.raceId === raceId) {
      setParticipants(results.participants);
      setMode(results.mode);
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

  return (
    <RaceResults
      participants={participants}
      mode={mode}
      onNewRace={() => {
        sessionStorage.removeItem('currentRace');
        sessionStorage.removeItem('raceResults');
        navigate('/');
      }}
    />
  );
};
