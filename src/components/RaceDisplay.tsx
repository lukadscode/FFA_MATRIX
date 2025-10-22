import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Participant, Race } from '../lib/supabase';
import { useErgRaceWebSocket, PM5Data } from '../hooks/useErgRaceWebSocket';
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
  const lastStrokeTimeRef = useRef<Map<string, number>>(new Map());
  const consecutiveInCadenceRef = useRef<Map<string, number>>(new Map());
  const lastCadenceChangeRef = useRef<string | null>(null);

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

      await supabase
        .from('participants')
        .update({
          current_cadence: cadence,
          is_in_cadence: isInCadence,
          total_distance_in_cadence: newTotalDistance,
        })
        .eq('id', participant.id);

      if (distanceGained > 0) {
        await supabase.from('cadence_events').insert({
          participant_id: participant.id,
          race_id: raceId,
          cadence: cadence,
          was_in_cadence: isInCadence,
          distance_gained: distanceGained,
        });
      }
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
      const { data } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId)
        .single();

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
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('race_id', raceId)
        .order('created_at');

      if (data) {
        setParticipants(data);
      }
    };

    loadRace();
    loadParticipants();

    const raceChannel = supabase
      .channel(`race_updates_${raceId}`)
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

    const participantsChannel = supabase
      .channel(`participants_${raceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `race_id=eq.${raceId}`,
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(raceChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [raceId]);

  useEffect(() => {
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
  }, []);

  const handleRaceEnd = async () => {
    await supabase
      .from('races')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', raceId);

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
