export type Race = {
  id: string;
  name: string;
  mode: 'solo' | 'team';
  target_cadence: number;
  cadence_tolerance: number;
  duration_seconds: number;
  status: 'setup' | 'active' | 'completed';
  started_at: string | null;
  ended_at: string | null;
  last_cadence_change: string | null;
  created_at: string;
};

export type Participant = {
  id: string;
  race_id: string;
  name: string;
  team_id: number | null;
  ws_connection_id: string | null;
  total_distance_in_cadence: number;
  current_cadence: number;
  is_in_cadence: boolean;
  created_at: string;
};

export type CadenceEvent = {
  id: string;
  participant_id: string;
  race_id: string;
  cadence: number;
  was_in_cadence: boolean;
  distance_gained: number;
  timestamp: string;
};
