import { Participant } from '../lib/types';
import { Trophy, Medal, Award } from 'lucide-react';

type RaceResultsProps = {
  participants: Participant[];
  mode: 'solo' | 'team';
  onNewRace: () => void;
};

export const RaceResults = ({ participants, mode, onNewRace }: RaceResultsProps) => {
  const getSortedResults = () => {
    if (mode === 'solo') {
      return [...participants].sort(
        (a, b) => b.total_distance_in_cadence - a.total_distance_in_cadence
      );
    } else {
      const teams = new Map<number, Participant[]>();
      participants.forEach(p => {
        if (p.team_id !== null) {
          if (!teams.has(p.team_id)) {
            teams.set(p.team_id, []);
          }
          teams.get(p.team_id)!.push(p);
        }
      });

      const teamResults = Array.from(teams.entries()).map(([teamId, members]) => ({
        teamId,
        members,
        distance: Math.min(...members.map(m => m.total_distance_in_cadence)),
      }));

      return teamResults.sort((a, b) => b.distance - a.distance);
    }
  };

  const results = getSortedResults();

  const getPodiumIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-12 h-12 text-yellow-400" />;
      case 1:
        return <Medal className="w-10 h-10 text-gray-300" />;
      case 2:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-black/80 border-2 border-green-400 rounded-lg p-8 backdrop-blur-sm shadow-2xl shadow-green-500/50">
        <h1 className="text-5xl font-bold text-green-400 font-mono text-center mb-8 animate-pulse">
          RACE COMPLETE
        </h1>

        <div className="space-y-4 mb-8">
          {mode === 'solo' ? (
            (results as Participant[]).map((participant, index) => (
              <div
                key={participant.id}
                className="flex items-center gap-4 bg-green-500/10 border border-green-400/50 rounded-lg p-4 hover:bg-green-500/20 transition-all"
              >
                <div className="w-16 flex justify-center">
                  {getPodiumIcon(index) || (
                    <span className="text-3xl font-bold text-green-400 font-mono">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-green-400 font-mono">
                    {participant.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400 font-mono">
                    {participant.total_distance_in_cadence}m
                  </div>
                  <div className="text-sm text-green-300 font-mono">
                    IN TARGET CADENCE
                  </div>
                </div>
              </div>
            ))
          ) : (
            (results as Array<{ teamId: number; members: Participant[]; distance: number }>).map(
              (team, index) => (
                <div
                  key={team.teamId}
                  className="bg-green-500/10 border border-green-400/50 rounded-lg p-4 hover:bg-green-500/20 transition-all"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-16 flex justify-center">
                      {getPodiumIcon(index) || (
                        <span className="text-3xl font-bold text-green-400 font-mono">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-green-400 font-mono">
                        TEAM {team.teamId}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-400 font-mono">
                        {team.distance}m
                      </div>
                      <div className="text-sm text-green-300 font-mono">
                        SYNCHRONIZED DISTANCE
                      </div>
                    </div>
                  </div>
                  <div className="pl-20 space-y-2">
                    {team.members.map(member => (
                      <div
                        key={member.id}
                        className="flex justify-between text-sm bg-black/30 rounded p-2"
                      >
                        <span className="text-green-300 font-mono">{member.name}</span>
                        <span className="text-green-400 font-mono">
                          {member.total_distance_in_cadence}m individual
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>

        <div className="text-center">
          <button
            onClick={onNewRace}
            className="px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-mono font-bold text-xl rounded-lg transition-colors shadow-lg shadow-green-500/50"
          >
            NEW RACE
          </button>
        </div>
      </div>
    </div>
  );
};
