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
import { wsClient } from '../lib/websocket';

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
  const lastDistanceRef = useRef<Map<string, number>>(new Map());
  const isInCadenceRef = useRef<Map<string, boolean>>(new Map());
  const lastCadenceChangeRef = useRef<string | null>(null);
  const { raceStatus } = useErgRaceStatus();

  const handlePM5Data = useCallback(
    async (data: PM5Data, participantIndex: number) => {
      const participant = participants[participantIndex];
      if (!participant || data.cadence === undefined) return;

      const cadence = data.cadence;
      const currentDistance = data.distance || 0;
      const currentTargetCadence = race?.target_cadence ?? config.targetCadence;
      const currentTolerance = race?.cadence_tolerance ?? config.cadenceTolerance;
      const isInCadence =
        cadence >= (currentTargetCadence - currentTolerance) &&
        cadence <= (currentTargetCadence + currentTolerance);

      const wasInCadence = isInCadenceRef.current.get(participant.id) || false;
      const lastDistance = lastDistanceRef.current.get(participant.id);
      let newTotalDistance = participant.total_distance_in_cadence;

      if (isInCadence) {
        if (!wasInCadence) {
          newTotalDistance += 1;
          lastDistanceRef.current.set(participant.id, currentDistance);
          isInCadenceRef.current.set(participant.id, true);
        } else if (lastDistance !== undefined) {
          const strokeDistance = Math.floor(Math.abs(currentDistance - lastDistance) / 10);
          if (strokeDistance > 0) {
            newTotalDistance += strokeDistance;
            lastDistanceRef.current.set(participant.id, currentDistance);
          }
        }
      } else if (!isInCadence && wasInCadence) {
        isInCadenceRef.current.set(participant.id, false);
        lastDistanceRef.current.delete(participant.id);
      }

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
    const loadRace = async () => {
      const data = await wsClient.getRace(raceId);

      if (data) {
        if (lastCadenceChangeRef.current !== data.last_cadence_change) {
          if (lastCadenceChangeRef.current !== null) {
            playCadenceChangeSound();
            setShowCadenceNotification(true);
            setTimeout(() => setShowCadenceNotification(false), 5000);
          }
          lastCadenceChangeRef.current = data.last_cadence_change;
        }
        setRace(data);
      }
    };

    const loadParticipants = async () => {
      const data = await wsClient.getParticipants(raceId);
      if (data) {
        setParticipants(data);
      }
    };

    loadRace();
    loadParticipants();

    const unsubRace = wsClient.subscribe('raceUpdate', (message) => {
      if (message.data && (message.data as Race).id === raceId) {
        loadRace();
      }
    });

    const unsubParticipant = wsClient.subscribe('participantUpdate', (message) => {
      const participant = message.data as Participant;
      if (participant && participant.race_id === raceId) {
        loadParticipants();
      }
    });

    return () => {
      unsubRace();
      unsubParticipant();
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

      {raceStatus && raceStatus.state_desc && !raceStarted && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/90 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <div className="text-9xl font-bold text-green-400 font-mono mb-8 animate-pulse tracking-wider">
              {raceStatus.state_desc.toUpperCase()}
            </div>
            <div className="text-5xl text-yellow-400 font-mono animate-pulse">
              ⏳ EN ATTENTE DU DÉPART...
            </div>
          </div>
        </div>
      )}

      {raceStatus && raceStatus.state_desc && raceStarted && (
        <div className="fixed top-4 left-4 z-40 bg-black/80 border-2 border-cyan-400 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-cyan-400 font-mono text-sm">
            📍 ErgRace: <span className="font-bold">{raceStatus.state_desc.toUpperCase()}</span>
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
