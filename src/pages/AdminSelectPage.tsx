import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Race } from '../lib/types';
import { wsClient } from '../lib/websocket';
import { Play, RefreshCw, StopCircle, Activity } from 'lucide-react';

export const AdminSelectPage = () => {
  const navigate = useNavigate();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRaces = async () => {
    setLoading(true);
    const allRaces = await wsClient.getAllRaces();
    const sortedRaces = allRaces.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setRaces(sortedRaces);
    setLoading(false);
  };

  useEffect(() => {
    loadRaces();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'completed':
        return 'text-blue-400';
      case 'setup':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'EN COURS';
      case 'completed':
        return 'TERMINÉE';
      case 'setup':
        return 'EN ATTENTE';
      default:
        return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-bold text-green-400 font-mono animate-pulse">
          CHARGEMENT...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold text-green-400 font-mono">
            ADMIN - SÉLECTION DE COURSE
          </h1>
          <button
            onClick={loadRaces}
            className="p-4 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate('/stop-race')}
            className="flex items-center justify-center gap-3 p-6 bg-red-500 text-black font-mono font-bold text-xl rounded-lg hover:bg-red-400 transition-colors"
          >
            <StopCircle className="w-8 h-8" />
            ARRÊTER UNE COURSE
          </button>
          <button
            onClick={() => navigate('/leds-logs')}
            className="flex items-center justify-center gap-3 p-6 bg-blue-500 text-black font-mono font-bold text-xl rounded-lg hover:bg-blue-400 transition-colors"
          >
            <Activity className="w-8 h-8" />
            LOGS LEDS
          </button>
        </div>

        {races.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-2xl text-gray-400 font-mono mb-4">
              Aucune course disponible
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-green-500 text-black font-mono font-bold rounded"
            >
              CRÉER UNE COURSE
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {races.map((race) => (
              <div
                key={race.id}
                className="bg-black/50 border-2 border-green-500 rounded-lg p-6 hover:border-green-400 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/${race.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-green-400 font-mono mb-2">
                      {race.name}
                    </h2>
                    <div className="flex gap-4 text-sm font-mono text-gray-400">
                      <span>Mode: {race.mode === 'solo' ? 'SOLO' : 'ÉQUIPE'}</span>
                      <span>Cadence cible: {race.target_cadence} SPM</span>
                      <span>Durée: {Math.floor(race.duration_seconds / 60)}:{(race.duration_seconds % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-xl font-bold font-mono ${getStatusColor(race.status)}`}>
                      {getStatusLabel(race.status)}
                    </div>
                    <Play className="w-8 h-8 text-green-400" />
                  </div>
                </div>

                <div className="text-sm font-mono text-gray-500">
                  Créée le: {new Date(race.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
