import { useState, useEffect } from 'react';
import { supabase, Race } from '../lib/supabase';
import { Activity, Settings, Plus, Minus } from 'lucide-react';

type LiveDashboardProps = {
  raceId: string;
  onCadenceChange: () => void;
};

export const LiveDashboard = ({ raceId, onCadenceChange }: LiveDashboardProps) => {
  const [race, setRace] = useState<Race | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadRace();

    const channel = supabase
      .channel(`dashboard_${raceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'races',
          filter: `id=eq.${raceId}`,
        },
        () => {
          loadRace();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [raceId]);

  const loadRace = async () => {
    const { data } = await supabase
      .from('races')
      .select('*')
      .eq('id', raceId)
      .single();

    if (data) {
      setRace(data);
    }
  };

  const updateCadence = async (newCadence: number) => {
    if (!race) return;

    await supabase
      .from('races')
      .update({
        target_cadence: newCadence,
        last_cadence_change: new Date().toISOString(),
      })
      .eq('id', raceId);

    onCadenceChange();
  };

  const updateTolerance = async (newTolerance: number) => {
    if (!race) return;

    await supabase
      .from('races')
      .update({
        cadence_tolerance: Math.max(1, newTolerance),
        last_cadence_change: new Date().toISOString(),
      })
      .eq('id', raceId);

    onCadenceChange();
  };

  if (!race) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-40 bg-green-500 hover:bg-green-400 text-black p-4 rounded-full shadow-lg shadow-green-500/50 transition-all"
      >
        <Settings className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed top-20 right-4 z-40 bg-black/95 border-2 border-green-400 rounded-lg p-6 shadow-2xl shadow-green-500/50 backdrop-blur-sm w-96">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-green-400 font-mono">CONTRÔLE LIVE</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-green-400 font-mono text-sm mb-3">
                CADENCE CIBLE:
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateCadence(race.target_cadence - 1)}
                  className="bg-green-500/20 hover:bg-green-500/40 border border-green-400 rounded p-2 transition-all"
                >
                  <Minus className="w-5 h-5 text-green-400" />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-5xl font-bold text-green-400 font-mono">
                    {race.target_cadence}
                  </div>
                  <div className="text-sm text-green-300 font-mono">SPM</div>
                </div>
                <button
                  onClick={() => updateCadence(race.target_cadence + 1)}
                  className="bg-green-500/20 hover:bg-green-500/40 border border-green-400 rounded p-2 transition-all"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                {[18, 20, 22, 24, 26, 28].map((cadence) => (
                  <button
                    key={cadence}
                    onClick={() => updateCadence(cadence)}
                    className={`flex-1 py-2 rounded font-mono text-sm transition-all ${
                      race.target_cadence === cadence
                        ? 'bg-green-500 text-black font-bold'
                        : 'bg-green-500/20 text-green-400 border border-green-400 hover:bg-green-500/40'
                    }`}
                  >
                    {cadence}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-green-400/30 pt-6">
              <label className="block text-green-400 font-mono text-sm mb-3">
                TOLÉRANCE (±):
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateTolerance(race.cadence_tolerance - 1)}
                  className="bg-green-500/20 hover:bg-green-500/40 border border-green-400 rounded p-2 transition-all"
                  disabled={race.cadence_tolerance <= 1}
                >
                  <Minus className="w-5 h-5 text-green-400" />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold text-green-400 font-mono">
                    ±{race.cadence_tolerance}
                  </div>
                  <div className="text-sm text-green-300 font-mono">SPM</div>
                </div>
                <button
                  onClick={() => updateTolerance(race.cadence_tolerance + 1)}
                  className="bg-green-500/20 hover:bg-green-500/40 border border-green-400 rounded p-2 transition-all"
                >
                  <Plus className="w-5 h-5 text-green-400" />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4].map((tolerance) => (
                  <button
                    key={tolerance}
                    onClick={() => updateTolerance(tolerance)}
                    className={`flex-1 py-2 rounded font-mono text-sm transition-all ${
                      race.cadence_tolerance === tolerance
                        ? 'bg-green-500 text-black font-bold'
                        : 'bg-green-500/20 text-green-400 border border-green-400 hover:bg-green-500/40'
                    }`}
                  >
                    ±{tolerance}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-green-400/30 pt-4">
              <div className="bg-green-500/10 rounded p-3">
                <div className="text-sm text-green-300 font-mono mb-1">PLAGE ACCEPTÉE:</div>
                <div className="text-2xl font-bold text-green-400 font-mono text-center">
                  {race.target_cadence - race.cadence_tolerance} - {race.target_cadence + race.cadence_tolerance} SPM
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
