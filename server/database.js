import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'race.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS races (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('solo', 'team')),
    target_cadence INTEGER NOT NULL,
    cadence_tolerance INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('setup', 'active', 'completed')),
    started_at TEXT,
    ended_at TEXT,
    last_cadence_change TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    race_id TEXT NOT NULL,
    name TEXT NOT NULL,
    team_id INTEGER,
    ws_connection_id TEXT,
    total_distance_in_cadence REAL DEFAULT 0,
    current_cadence INTEGER DEFAULT 0,
    is_in_cadence INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cadence_events (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL,
    race_id TEXT NOT NULL,
    cadence INTEGER NOT NULL,
    was_in_cadence INTEGER NOT NULL,
    distance_gained REAL DEFAULT 0,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_participants_race_id ON participants(race_id);
  CREATE INDEX IF NOT EXISTS idx_cadence_events_race_id ON cadence_events(race_id);
  CREATE INDEX IF NOT EXISTS idx_cadence_events_participant_id ON cadence_events(participant_id);
`);

export function getRace(id) {
  return db.prepare('SELECT * FROM races WHERE id = ?').get(id);
}

export function getActiveRace() {
  return db.prepare('SELECT * FROM races WHERE status = ? ORDER BY created_at DESC LIMIT 1').get('active');
}

export function getAllRaces() {
  return db.prepare('SELECT * FROM races ORDER BY created_at DESC').all();
}

export function createRace(race) {
  const stmt = db.prepare(`
    INSERT INTO races (id, name, mode, target_cadence, cadence_tolerance, duration_seconds, status, started_at, ended_at, last_cadence_change, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(race.id, race.name, race.mode, race.target_cadence, race.cadence_tolerance, race.duration_seconds, race.status, race.started_at, race.ended_at, race.last_cadence_change, race.created_at);
  return race;
}

export function updateRace(id, updates) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE races SET ${fields} WHERE id = ?`).run(...values, id);
  return getRace(id);
}

export function deleteRace(id) {
  db.prepare('DELETE FROM races WHERE id = ?').run(id);
}

export function getParticipants(raceId) {
  return db.prepare('SELECT * FROM participants WHERE race_id = ? ORDER BY created_at').all(raceId);
}

export function getParticipant(id) {
  return db.prepare('SELECT * FROM participants WHERE id = ?').get(id);
}

export function createParticipant(participant) {
  const stmt = db.prepare(`
    INSERT INTO participants (id, race_id, name, team_id, ws_connection_id, total_distance_in_cadence, current_cadence, is_in_cadence, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(participant.id, participant.race_id, participant.name, participant.team_id, participant.ws_connection_id, participant.total_distance_in_cadence, participant.current_cadence, participant.is_in_cadence ? 1 : 0, participant.created_at);
  return participant;
}

export function updateParticipant(id, updates) {
  const fields = [];
  const values = [];

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    if (key === 'is_in_cadence') {
      values.push(value ? 1 : 0);
    } else {
      values.push(value);
    }
  });

  db.prepare(`UPDATE participants SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  return getParticipant(id);
}

export function deleteParticipants(raceId) {
  db.prepare('DELETE FROM participants WHERE race_id = ?').run(raceId);
}

export function createCadenceEvent(event) {
  const stmt = db.prepare(`
    INSERT INTO cadence_events (id, participant_id, race_id, cadence, was_in_cadence, distance_gained, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(event.id, event.participant_id, event.race_id, event.cadence, event.was_in_cadence ? 1 : 0, event.distance_gained, event.timestamp);
  return event;
}

export function getCadenceEvents(raceId) {
  return db.prepare('SELECT * FROM cadence_events WHERE race_id = ? ORDER BY timestamp').all(raceId);
}

export default db;
