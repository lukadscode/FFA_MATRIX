import { useState, useEffect, useCallback, useRef } from 'react';
import { Participant, Race } from '../lib/types';
import { useErgRaceWebSocket, PM5Data } from '../hooks/useErgRaceWebSocket';
import { useErgRaceStatus } from '../hooks/useErgRaceStatus';
import { ParticipantCard } from './ParticipantCard';
import { TeamCard } from './TeamCard';
import { RaceConfig } from './RaceSetup';
import { CadenceChangeNotification } from './CadenceChangeNotification';
import { playCadenceChangeSound } from '../utils/sound';
import { Settings } from 'lucide-react';

type RaceDisplayProps = {
  raceId: string;
  config: RaceConfig;
  onRaceComplete: () => void;
  onOpenAdmin: () => void;
};

export const RaceDisplay = ({ raceId, config, onRaceComplete, onOpenAdmin }: RaceDisplayProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [race, setRace] = useState<Race | null>(null);
  const [showCadenceNotification, setShowCadenceNotification] = useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const lastStrokeTimeRef = useRef<Map<string, number>>(new Map());
  const consecutiveInCadenceRef = useRef<Map<string, number>>(new Map());
  const lastCadenceChangeRef = useRef<string | null>(null);
  const { raceStatus } = useErgRaceStatus();

  const handlePM5Data = useCallback(
    async (data: PM5Data, participantIndex: number) => {
      const participant = participants[participantIndex];
      if (!participant || data.cadence === undefined) return;

      const now = Date.now();
      const cadence = data.cadence;
      const currentTargetCadence = race?.target_cadence ?? config.targetCadence;
      const currentTolerance = race?.cadence_tolerance ?? config.cadenceTolerance;
      const isInCadence =
        cadence >= (currentTargetCadence - currentTolerance) &&
        cadence <= (currentTargetCadence + currentTolerance);

      let distanceGained = 0;

      if (isInCadence) {
        const lastStrokeTime = lastStrokeTimeRef.current.get(participant.id);
        const consecutiveCount = consecutiveInCadenceRef.current.get(participant.id) || 0;

        if (consecutiveCount === 0) {
          distanceGained = 1;
        } else if (lastStrokeTime) {
          const timeDiff = (now - lastStrokeTime) / 1000;
          distanceGained = Math.max(1, Math.round(timeDiff));
        } else {
          distanceGained = 1;
        }

        consecutiveInCadenceRef.current.set(participant.id, consecutiveCount + 1);
        lastStrokeTimeRef.current.set(participant.id, now);
      } else {
        consecutiveInCadenceRef.current.set(participant.id, 0);
      }

      const newTotalDistance = participant.total_distance_in_cadence + distanceGained;

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participant.id
            ? {
                ...p,
                current_cadence: cadence,
                is_in_cadence: isInCadence,
                total_distance_in_cadence: newTotalDistance,
              }
            : p
        )
      );
    },
    [participants, config, raceId, race]
  );

  const { connectionStates } = useErgRaceWebSocket(
    participants.length,
    handlePM5Data,
    true
  );

  useEffect(() => {
    const raceDataStr = sessionStorage.getItem('currentRace');
    if (raceDataStr) {
      const raceData = JSON.parse(raceDataStr);
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
        last_cadence_change: raceData.last_cadence_change || null,
        created_at: raceData.started_at,
      });

      setParticipants(
        raceData.participants.map((p: { id: string; name: string; teamId?: number; index: number }) => ({
          id: p.id,
          race_id: raceData.id,
          name: p.name,
          team_id: p.teamId || null,
          ws_connection_id: null,
          total_distance_in_cadence: 0,
          current_cadence: 0,
          is_in_cadence: false,
          created_at: raceData.started_at,
        }))
      );
    }

    const handleConfigUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;

      if (lastCadenceChangeRef.current !== updatedData.last_cadence_change) {
        if (lastCadenceChangeRef.current !== null) {
          playCadenceChangeSound();
          setShowCadenceNotification(true);
          setTimeout(() => setShowCadenceNotification(false), 5000);
        }
        lastCadenceChangeRef.current = updatedData.last_cadence_change;
      }

      setRace({
        id: updatedData.id,
        name: updatedData.name,
        mode: updatedData.mode,
        target_cadence: updatedData.target_cadence,
        cadence_tolerance: updatedData.cadence_tolerance,
        duration_seconds: updatedData.duration_seconds,
        status: updatedData.status,
        started_at: updatedData.started_at,
        ended_at: null,
        last_cadence_change: updatedData.last_cadence_change,
        created_at: updatedData.started_at,
      });
    };

    window.addEventListener('raceConfigUpdated', handleConfigUpdate as EventListener);

    return () => {
      window.removeEventListener('raceConfigUpdated', handleConfigUpdate as EventListener);
    };
  }, [raceId]);

  useEffect(() => {
    if (raceStatus?.state === 9 && !raceStarted) {
      console.log('🏁 ErgRace démarré ! Lancement du chronomètre');
      setRaceStarted(true);
    }

    if (raceStatus?.state === 11 && raceStarted) {
      console.log('🏁 ErgRace terminé ! Fin de la course');
      handleRaceEnd();
    }
  }, [raceStatus, raceStarted]);

  useEffect(() => {
    if (!raceStarted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRaceEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [raceStarted]);

  const handleRaceEnd = async () => {
    sessionStorage.setItem('raceResults', JSON.stringify({
      raceId,
      mode: config.mode,
      participants,
    }));
    onRaceComplete();
  };

  const renderSoloMode = () => {
    const sortedParticipants = [...participants].sort(
      (a, b) => b.total_distance_in_cadence - a.total_distance_in_cadence
    );

    const gridCols = participants.length <= 4 ? 'grid-cols-1 md:grid-cols-2' :
                     participants.length <= 9 ? 'grid-cols-2 md:grid-cols-3' :
                     'grid-cols-2 md:grid-cols-4';

    return (
      <div className={`grid ${gridCols} gap-3`}>
        {sortedParticipants.map((participant, rankIndex) => {
          const originalIndex = participants.findIndex(p => p.id === participant.id);
          return (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              mode="solo"
              timeRemaining={timeRemaining}
              connectionState={connectionStates[originalIndex] || 'DISCONNECTED'}
              rank={rankIndex + 1}
            />
          );
        })}
      </div>
    );
  };

  const renderTeamMode = () => {
    const teams = new Map<number, Participant[]>();
    participants.forEach((p) => {
      if (p.team_id !== null) {
        if (!teams.has(p.team_id)) {
          teams.set(p.team_id, []);
        }
        teams.get(p.team_id)!.push(p);
      }
    });

    const teamsArray = Array.from(teams.entries()).map(([teamId, teamMembers]) => {
      const totalDistance = teamMembers.reduce((sum, m) => sum + m.total_distance_in_cadence, 0);
      return { teamId, teamMembers, totalDistance };
    });

    teamsArray.sort((a, b) => b.totalDistance - a.totalDistance);

    return (
      <div className="space-y-4">
        {teamsArray.map(({ teamId, teamMembers }, rankIndex) => {
          const teamConnectionStates = teamMembers.map((member) => {
            const index = participants.findIndex((p) => p.id === member.id);
            return connectionStates[index] || 'DISCONNECTED';
          });

          return (
            <TeamCard
              key={teamId}
              teamId={teamId}
              participants={teamMembers}
              timeRemaining={timeRemaining}
              connectionStates={teamConnectionStates}
              rank={rankIndex + 1}
            />
          );
        })}
      </div>
    );
  };

  const currentTargetCadence = race?.target_cadence ?? config.targetCadence;
  const currentTolerance = race?.cadence_tolerance ?? config.cadenceTolerance;

  return (
    <div className="min-h-screen p-6">
      <button
        onClick={onOpenAdmin}
        className="fixed top-4 right-4 z-40 bg-green-500 hover:bg-green-400 text-black p-4 rounded-full shadow-lg shadow-green-500/50 transition-all"
      >
        <Settings className="w-6 h-6" />
      </button>

      {raceStatus && (
        <div className="fixed top-4 left-4 z-40 bg-black/80 border-2 border-cyan-400 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-cyan-400 font-mono text-sm">
            📍 ErgRace: <span className="font-bold">{raceStatus.state_desc.toUpperCase()}</span>
          </div>
        </div>
      )}

      {!raceStarted && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-500/20 border-2 border-yellow-400 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-yellow-400 font-mono text-center font-bold text-xl animate-pulse">
            ⏳ EN ATTENTE DU DÉPART ERGRACE...
          </div>
        </div>
      )}

      <CadenceChangeNotification
        targetCadence={currentTargetCadence}
        tolerance={currentTolerance}
        show={showCadenceNotification}
      />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-green-400 font-mono mb-4 animate-pulse">
            {config.name.toUpperCase()}
          </h1>
          <div className="text-3xl font-mono text-green-400">
            CADENCE CIBLE: {currentTargetCadence} SPM (±{currentTolerance})
          </div>
          <div className="text-2xl font-mono text-green-300 mt-2">
            PLAGE: {currentTargetCadence - currentTolerance} - {currentTargetCadence + currentTolerance} SPM
          </div>
          <div className="text-5xl font-mono text-green-400 mt-4 font-bold">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {config.mode === 'solo' ? renderSoloMode() : renderTeamMode()}
      </div>
    </div>
  );
};
