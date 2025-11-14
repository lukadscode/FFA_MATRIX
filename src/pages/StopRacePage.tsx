import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Race } from '../lib/types';
import { wsClient } from '../lib/websocket';
import { StopCircle, RefreshCw, ArrowLeft, Trash2 } from 'lucide-react';

export const StopRacePage = () => {
  const navigate = useNavigate();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadActiveRaces = async () => {
    setLoading(true);
    const allRaces = await wsClient.getAllRaces();
    const activeRaces = allRaces.filter(race => race.status === 'active');
    const sortedRaces = activeRaces.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setRaces(sortedRaces);
    setLoading(false);
  };

  useEffect(() => {
    loadActiveRaces();
  }, []);

  const handleStopRace = async (raceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir arrêter cette course ?')) {
      return;
    }

    setStopping(raceId);
    try {
      await wsClient.updateRaceStatus(raceId, 'completed');
      await loadActiveRaces();
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la course:', error);
      alert('Erreur lors de l\'arrêt de la course');
    } finally {
      setStopping(null);
    }
  };

  const handleDeleteRace = async (raceId: string) => {
    if (!confirm('⚠️ ATTENTION: Cette action va SUPPRIMER DÉFINITIVEMENT la course et toutes ses données. Continuer ?')) {
      return;
    }

    setDeleting(raceId);
    try {
      const success = await wsClient.deleteRace(raceId);
      if (success) {
        await loadActiveRaces();
      } else {
        alert('Erreur lors de la suppression de la course');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la course:', error);
      alert('Erreur lors de la suppression de la course');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-bold text-red-400 font-mono animate-pulse">
          CHARGEMENT...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin-select')}
              className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-5xl font-bold text-red-400 font-mono">
              ARRÊTER UNE COURSE
            </h1>
          </div>
          <button
            onClick={loadActiveRaces}
            className="p-4 bg-red-500 text-black rounded-lg hover:bg-red-400 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>

        {races.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-2xl text-gray-400 font-mono mb-4">
              Aucune course active en ce moment
            </div>
            <button
              onClick={() => navigate('/admin-select')}
              className="px-6 py-3 bg-green-500 text-black font-mono font-bold rounded"
            >
              RETOUR
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {races.map((race) => (
              <div
                key={race.id}
                className="bg-black/50 border-2 border-red-500 rounded-lg p-6 hover:border-red-400 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-red-400 font-mono mb-2">
                      {race.name}
                    </h2>
                    <div className="flex gap-4 text-sm font-mono text-gray-400">
                      <span>Mode: {race.mode === 'solo' ? 'SOLO' : 'ÉQUIPE'}</span>
                      <span>Cadence cible: {race.target_cadence} SPM</span>
                      <span>Durée: {Math.floor(race.duration_seconds / 60)}:{(race.duration_seconds % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStopRace(race.id)}
                      disabled={stopping === race.id || deleting === race.id}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-mono font-bold transition-colors ${
                        stopping === race.id || deleting === race.id
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-orange-500 text-black hover:bg-orange-400'
                      }`}
                    >
                      <StopCircle className="w-6 h-6" />
                      {stopping === race.id ? 'ARRÊT...' : 'ARRÊTER'}
                    </button>
                    <button
                      onClick={() => handleDeleteRace(race.id)}
                      disabled={stopping === race.id || deleting === race.id}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-mono font-bold transition-colors ${
                        stopping === race.id || deleting === race.id
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-red-500 text-black hover:bg-red-400'
                      }`}
                    >
                      <Trash2 className="w-6 h-6" />
                      {deleting === race.id ? 'SUPPRESSION...' : 'SUPPRIMER'}
                    </button>
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
