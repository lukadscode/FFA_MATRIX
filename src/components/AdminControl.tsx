import { useState, useEffect } from 'react';
import { Race } from '../lib/types';
import { Activity, Plus, Minus, Monitor, ArrowLeft } from 'lucide-react';
import { wsClient } from '../lib/websocket';

type AdminControlProps = {
  raceId: string;
  raceName: string;
  onBack: () => void;
};

export const AdminControl = ({ raceId, raceName, onBack }: AdminControlProps) => {
  const [race, setRace] = useState<Race | null>(null);

  useEffect(() => {
    loadRace();

    const unsubscribe = wsClient.subscribe('raceUpdate', (message) => {
      if (message.data && (message.data as Race).id === raceId) {
        loadRace();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [raceId]);

  const loadRace = async () => {
    const data = await wsClient.getRace(raceId);
    if (data) {
      setRace(data);
    }
  };

  const updateCadence = async (newCadence: number) => {
    if (!race) return;

    setRace({ ...race, target_cadence: newCadence });

    const updated = await wsClient.updateRace(raceId, {
      target_cadence: newCadence,
      last_cadence_change: new Date().toISOString(),
    });

    if (!updated) {
      console.error('Error updating cadence');
      loadRace();
    }
  };

  const updateTolerance = async (newTolerance: number) => {
    if (!race) return;

    const validTolerance = Math.max(0, newTolerance);
    setRace({ ...race, cadence_tolerance: validTolerance });

    const updated = await wsClient.updateRace(raceId, {
      cadence_tolerance: validTolerance,
      last_cadence_change: new Date().toISOString(),
    });

    if (!updated) {
      console.error('Error updating tolerance');
      loadRace();
    }
  };

  if (!race) return null;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-400 rounded hover:bg-green-500/40 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-mono text-sm">RETOUR À LA COURSE</span>
        </button>

        <div className="bg-black/90 border-2 border-green-400 rounded-lg p-4 shadow-2xl shadow-green-500/50">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-2xl font-bold text-green-400 font-mono">
                PANNEAU DE CONTRÔLE
              </h1>
              <p className="text-green-300 font-mono text-sm mt-1">{raceName}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/50">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-green-400 font-mono">
                  CADENCE CIBLE
                </h2>
              </div>

              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => updateCadence(race.target_cadence - 1)}
                  className="bg-green-500 hover:bg-green-400 text-black rounded-full p-3 transition-all shadow-lg shadow-green-500/50"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-400 font-mono">
                    {race.target_cadence}
                  </div>
                  <div className="text-lg text-green-300 font-mono mt-1">SPM</div>
                </div>
                <button
                  onClick={() => updateCadence(race.target_cadence + 1)}
                  className="bg-green-500 hover:bg-green-400 text-black rounded-full p-3 transition-all shadow-lg shadow-green-500/50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {[18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40].map((cadence) => (
                  <button
                    key={cadence}
                    onClick={() => updateCadence(cadence)}
                    className={`py-3 rounded-lg font-mono text-base font-bold transition-all ${
                      race.target_cadence === cadence
                        ? 'bg-green-500 text-black shadow-lg shadow-green-500/50'
                        : 'bg-green-500/20 text-green-400 border border-green-400 hover:bg-green-500/40'
                    }`}
                  >
                    {cadence}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-green-500/10 rounded-lg p-4 border border-green-400/50">
              <h2 className="text-xl font-bold text-green-400 font-mono mb-4">
                TOLÉRANCE
              </h2>

              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => updateTolerance(race.cadence_tolerance - 1)}
                  disabled={race.cadence_tolerance <= 0}
                  className="bg-green-500 hover:bg-green-400 text-black rounded-full p-3 transition-all shadow-lg shadow-green-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 font-mono">
                    ±{race.cadence_tolerance}
                  </div>
                  <div className="text-lg text-green-300 font-mono mt-1">SPM</div>
                </div>
                <button
                  onClick={() => updateTolerance(race.cadence_tolerance + 1)}
                  className="bg-green-500 hover:bg-green-400 text-black rounded-full p-3 transition-all shadow-lg shadow-green-500/50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((tolerance) => (
                  <button
                    key={tolerance}
                    onClick={() => updateTolerance(tolerance)}
                    className={`py-3 rounded-lg font-mono text-base font-bold transition-all ${
                      race.cadence_tolerance === tolerance
                        ? 'bg-green-500 text-black shadow-lg shadow-green-500/50'
                        : 'bg-green-500/20 text-green-400 border border-green-400 hover:bg-green-500/40'
                    }`}
                  >
                    ±{tolerance}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-green-500/20 rounded-lg p-4 border-2 border-green-400">
              <div className="text-center">
                <div className="text-base text-green-300 font-mono mb-2">
                  PLAGE ACCEPTÉE ACTUELLEMENT
                </div>
                <div className="text-3xl font-bold text-green-400 font-mono">
                  {race.cadence_tolerance === 0
                    ? `Exactement ${race.target_cadence}`
                    : `${race.target_cadence - race.cadence_tolerance} - ${race.target_cadence + race.cadence_tolerance}`
                  }
                </div>
                <div className="text-lg text-green-300 font-mono mt-1">SPM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
