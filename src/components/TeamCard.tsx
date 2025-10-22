import { Participant } from '../lib/types';
import { Users, Trophy } from 'lucide-react';

type TeamCardProps = {
  teamId: number;
  participants: Participant[];
  timeRemaining: number;
  connectionStates: string[];
  rank?: number;
};

export const TeamCard = ({
  teamId,
  participants,
  timeRemaining,
  connectionStates,
  rank,
}: TeamCardProps) => {
  const allInCadence = participants.every(p => p.is_in_cadence);
  const totalDistance = Math.min(...participants.map(p => p.total_distance_in_cadence));

  const bgColor = allInCadence
    ? 'bg-green-500/20 border-green-400'
    : 'bg-red-500/20 border-red-400';

  const glowColor = allInCadence
    ? 'shadow-green-500/50'
    : 'shadow-red-500/50';

  const rankColors = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-orange-400',
  };

  return (
    <div
      className={`${bgColor} ${glowColor} border-2 rounded-lg p-4 backdrop-blur-sm transition-all duration-500 shadow-lg`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {rank && rank <= 3 ? (
            <Trophy className={`w-6 h-6 ${rankColors[rank as keyof typeof rankColors]}`} />
          ) : (
            <Users className="w-6 h-6 text-green-400" />
          )}
          {rank && (
            <span className="text-2xl font-bold text-green-400 font-mono bg-black/50 px-3 py-1 rounded">
              #{rank}
            </span>
          )}
          <h3 className="text-2xl font-bold text-green-400 font-mono">
            TEAM {teamId}
          </h3>
        </div>
        <span className="text-green-400 font-mono text-sm">
          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-green-300 font-mono text-sm">TEAM DISTANCE:</span>
          <span className="text-3xl font-bold text-green-400 font-mono">
            {totalDistance}m
          </span>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              allInCadence ? 'bg-green-400' : 'bg-red-400'
            }`}
            style={{
              width: `${Math.min((totalDistance / 500) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {participants.map((participant, idx) => (
          <div
            key={participant.id}
            className="bg-black/50 rounded p-2 border border-green-400/30"
          >
            <h4 className="text-sm font-bold text-green-400 font-mono mb-2 truncate">
              {participant.name}
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-green-300 font-mono">CAD:</span>
                <span className="text-green-400 font-mono font-bold">
                  {participant.current_cadence}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-300 font-mono">DIST:</span>
                <span className="text-green-400 font-mono font-bold">
                  {participant.total_distance_in_cadence}m
                </span>
              </div>
              <div className="text-center">
                <span
                  className={`font-mono font-bold text-xs ${
                    participant.is_in_cadence ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {participant.is_in_cadence ? '✓ SYNC' : '✗ OUT'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allInCadence && (
        <div className="mt-3 text-center">
          <span className="text-green-400 font-mono text-sm font-bold animate-pulse">
            SYNCHRONIZED - DISTANCE COUNTING!
          </span>
        </div>
      )}
    </div>
  );
};
