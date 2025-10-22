import { Participant } from '../lib/types';
import { Activity, Users, Trophy } from 'lucide-react';

type ParticipantCardProps = {
  participant: Participant;
  mode: 'solo' | 'team';
  timeRemaining: number;
  connectionState: string;
  rank?: number;
};

export const ParticipantCard = ({
  participant,
  mode,
  timeRemaining,
  connectionState,
  rank,
}: ParticipantCardProps) => {
  const bgColor = participant.is_in_cadence
    ? 'bg-green-500/20 border-green-400'
    : 'bg-red-500/20 border-red-400';

  const glowColor = participant.is_in_cadence
    ? 'shadow-green-500/50'
    : 'shadow-red-500/50';

  const rankColors = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-orange-400',
  };

  return (
    <div
      className={`${bgColor} ${glowColor} border-2 rounded-lg p-3 backdrop-blur-sm transition-all duration-500 shadow-lg`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {rank && rank <= 3 ? (
            <Trophy className={`w-5 h-5 ${rankColors[rank as keyof typeof rankColors]}`} />
          ) : mode === 'team' ? (
            <Users className="w-5 h-5 text-green-400" />
          ) : (
            <Activity className="w-5 h-5 text-green-400" />
          )}
          {rank && (
            <span className="text-xl font-bold text-green-400 font-mono bg-black/50 px-2 py-0.5 rounded">
              #{rank}
            </span>
          )}
          <h3 className="text-lg font-bold text-green-400 font-mono">
            {participant.name}
          </h3>
        </div>
        {mode === 'team' && participant.team_id && (
          <span className="text-green-400 font-mono text-sm px-2 py-1 bg-black/50 rounded">
            T{participant.team_id}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-green-300 font-mono text-xs">CADENCE:</span>
              <span className="text-xl font-bold text-green-400 font-mono">
                {participant.current_cadence} SPM
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-300 font-mono text-xs">DISTANCE:</span>
              <span className="text-2xl font-bold text-green-400 font-mono">
                {participant.total_distance_in_cadence}m
              </span>
            </div>
          </div>
        </div>

        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              participant.is_in_cadence ? 'bg-green-400' : 'bg-red-400'
            }`}
            style={{
              width: `${Math.min((participant.total_distance_in_cadence / 500) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
