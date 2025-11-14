import { useState, useEffect } from 'react';
import { Play, Plus, Trash2, Radio, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useErgRaceStatus } from '../hooks/useErgRaceStatus';

export type RaceConfig = {
  name: string;
  mode: 'solo' | 'team';
  targetCadence: number;
  cadenceTolerance: number;
  participants: Array<{ name: string; teamId?: number }>;
};

type RaceSetupProps = {
  onStartRace: (config: RaceConfig) => void;
};

export const RaceSetup = ({ onStartRace }: RaceSetupProps) => {
  const navigate = useNavigate();
  const { raceDefinition, raceStatus, isConnected } = useErgRaceStatus();

  const [raceName, setRaceName] = useState('Matrix Race');
  const [mode, setMode] = useState<'solo' | 'team'>('solo');
  const [targetCadence, setTargetCadence] = useState(22);
  const [cadenceTolerance, setCadenceTolerance] = useState(2);
  const [participants, setParticipants] = useState([
    { name: 'Participant 1', teamId: 1 },
    { name: 'Participant 2', teamId: 1 },
  ]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [ergRaceDetected, setErgRaceDetected] = useState(false);

  useEffect(() => {
    if (raceDefinition && !ergRaceDetected) {
      setRaceName(raceDefinition.name_long || raceDefinition.event_name || 'Matrix Race');

      const boats = raceDefinition.boats.map((boat, index) => ({
        name: boat.name || `Rameur ${index + 1}`,
        teamId: mode === 'team' ? Math.floor(index / 2) + 1 : undefined,
      }));

      if (boats.length > 0) {
        setParticipants(boats);
        setErgRaceDetected(true);
      }
    }
  }, [raceDefinition, ergRaceDetected, mode]);

  const loadFromErgRace = () => {
    if (raceDefinition) {
      setRaceName(raceDefinition.name_long || raceDefinition.event_name || 'Matrix Race');

      const boats = raceDefinition.boats.map((boat, index) => ({
        name: boat.name || `Rameur ${index + 1}`,
        teamId: mode === 'team' ? Math.floor(index / 2) + 1 : undefined,
      }));

      if (boats.length > 0) {
        setParticipants(boats);
      }
    }
  };

  const addParticipant = () => {
    if (newParticipantName.trim()) {
      const nextTeamId = mode === 'team'
        ? Math.floor(participants.length / 2) + 1
        : undefined;

      setParticipants([
        ...participants,
        { name: newParticipantName.trim(), teamId: nextTeamId },
      ]);
      setNewParticipantName('');
    }
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateTeamId = (index: number, teamId: number) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], teamId };
    setParticipants(updated);
  };

  const handleStart = () => {
    if (participants.length === 0) {
      alert('Add at least one participant');
      return;
    }

    if (mode === 'team' && participants.length < 2) {
      alert('Team mode requires at least 2 participants');
      return;
    }

    onStartRace({
      name: raceName,
      mode,
      targetCadence,
      cadenceTolerance,
      participants,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-black/80 border-2 border-green-400 rounded-lg p-8 backdrop-blur-sm shadow-2xl shadow-green-500/50">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-bold text-green-400 font-mono animate-pulse">
            RACE SETUP
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/ergrace-logs')}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400 rounded hover:bg-cyan-500/40 transition-all"
            >
              <Radio className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 font-mono font-bold">LOGS</span>
            </button>
          </div>
        </div>

        {isConnected && raceDefinition && (
          <div className="mb-6 bg-green-500/10 border border-green-400 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-300 font-mono mb-1">
                  ✅ ErgRace détecté : {raceDefinition.boats.length} rameur(s)
                </div>
                <div className="text-xs text-green-400 font-mono">
                  Course : {raceDefinition.name_long || raceDefinition.event_name}
                </div>
              </div>
              <button
                onClick={loadFromErgRace}
                className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-400 rounded hover:bg-green-500/40 transition-all"
              >
                <Download className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-mono text-sm">CHARGER</span>
              </button>
            </div>
          </div>
        )}

        {raceStatus && raceStatus.state_desc !== 'inactive' && (
          <div className="mb-6 bg-cyan-500/10 border border-cyan-400 rounded-lg p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400 font-mono">
                📍 ErgRace : {raceStatus.state_desc.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-green-400 font-mono mb-2">RACE NAME:</label>
            <input
              type="text"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
              className="w-full bg-black/50 border border-green-400 rounded px-4 py-2 text-green-400 font-mono focus:outline-none focus:border-green-300"
            />
          </div>

          <div>
            <label className="block text-green-400 font-mono mb-2">MODE:</label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('solo')}
                className={`flex-1 py-3 rounded font-mono font-bold transition-all ${
                  mode === 'solo'
                    ? 'bg-green-500 text-black'
                    : 'bg-black/50 text-green-400 border border-green-400 hover:bg-green-500/20'
                }`}
              >
                SOLO
              </button>
              <button
                onClick={() => setMode('team')}
                className={`flex-1 py-3 rounded font-mono font-bold transition-all ${
                  mode === 'team'
                    ? 'bg-green-500 text-black'
                    : 'bg-black/50 text-green-400 border border-green-400 hover:bg-green-500/20'
                }`}
              >
                TEAM
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-green-400 font-mono mb-2">CADENCE CIBLE (SPM):</label>
              <input
                type="number"
                value={targetCadence}
                onChange={(e) => setTargetCadence(Number(e.target.value))}
                className="w-full bg-black/50 border border-green-400 rounded px-4 py-2 text-green-400 font-mono focus:outline-none focus:border-green-300"
              />
            </div>
            <div>
              <label className="block text-green-400 font-mono mb-2">TOLÉRANCE (±SPM):</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={cadenceTolerance}
                  onChange={(e) => setCadenceTolerance(Number(e.target.value))}
                  className="flex-1 bg-black/50 border border-green-400 rounded px-4 py-2 text-green-400 font-mono focus:outline-none focus:border-green-300"
                />
                <button
                  onClick={() => setCadenceTolerance(0)}
                  className={`px-3 py-2 rounded font-mono font-bold transition-all ${
                    cadenceTolerance === 0
                      ? 'bg-green-500 text-black'
                      : 'bg-black/50 text-green-400 border border-green-400 hover:bg-green-500/20'
                  }`}
                >
                  0
                </button>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 rounded p-3 border border-green-400/50">
            <div className="text-sm text-green-300 font-mono mb-1 text-center">PLAGE ACCEPTÉE:</div>
            <div className="text-2xl font-bold text-green-400 font-mono text-center">
              {targetCadence - cadenceTolerance} - {targetCadence + cadenceTolerance} SPM
            </div>
          </div>

          <div>
            <label className="block text-green-400 font-mono mb-2">PARTICIPANTS:</label>
            <div className="space-y-2 mb-3">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={participant.name}
                    onChange={(e) => {
                      const updated = [...participants];
                      updated[index] = { ...updated[index], name: e.target.value };
                      setParticipants(updated);
                    }}
                    className="flex-1 bg-black/50 border border-green-400 rounded px-4 py-2 text-green-400 font-mono focus:outline-none focus:border-green-300"
                  />
                  {mode === 'team' && (
                    <input
                      type="number"
                      value={participant.teamId || 1}
                      onChange={(e) => updateTeamId(index, Number(e.target.value))}
                      className="w-20 bg-black/50 border border-green-400 rounded px-4 py-2 text-green-400 font-mono focus:outline-none focus:border-green-300"
                      placeholder="Team"
                    />
                  )}
                  <button
                    onClick={() => removeParticipant(index)}
                    className="p-2 bg-red-500/20 border border-red-400 rounded hover:bg-red-500/40 transition-all"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                placeholder="New participant name..."
                className="flex-1 bg-black/50 border border-green-400 rounded px-4 py-2 text-green-400 font-mono focus:outline-none focus:border-green-300 placeholder-green-400/50"
              />
              <button
                onClick={addParticipant}
                className="px-4 py-2 bg-green-500/20 border border-green-400 rounded hover:bg-green-500/40 transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-mono">ADD</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-mono font-bold text-xl rounded-lg transition-colors shadow-lg shadow-green-500/50 flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6" />
            START RACE
          </button>
        </div>
      </div>
    </div>
  );
};
