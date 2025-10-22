import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Circle, Trash2 } from 'lucide-react';

type ErgRaceLog = {
  timestamp: string;
  lane: number;
  message: string;
  type: 'data' | 'status' | 'connection' | 'error';
};

type RaceStatus = {
  state: number;
  state_desc: string;
  data?: Array<{ lane?: number }>;
};

const RACE_STATES: Record<number, { label: string; color: string }> = {
  1: { label: 'WARMUP', color: 'text-yellow-400' },
  2: { label: 'STOP ROWING', color: 'text-orange-400' },
  3: { label: 'READY', color: 'text-green-400' },
  4: { label: 'SIT READY', color: 'text-blue-400' },
  5: { label: 'ATTENTION', color: 'text-red-400' },
  6: { label: 'ROW', color: 'text-green-500' },
  7: { label: 'FALSE START', color: 'text-red-500' },
  8: { label: 'TECHNICAL HOLD', color: 'text-yellow-500' },
  9: { label: 'RACE RUNNING', color: 'text-green-400' },
  10: { label: 'RACE ABORTED', color: 'text-red-400' },
  11: { label: 'RACE COMPLETE', color: 'text-blue-400' },
  12: { label: 'FINAL RESULTS', color: 'text-purple-400' },
  13: { label: 'INACTIVE', color: 'text-gray-400' },
  14: { label: 'EXCHANGE', color: 'text-cyan-400' },
};

export const ErgRaceLogsPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ErgRaceLog[]>([]);
  const [raceStatus, setRaceStatus] = useState<RaceStatus | null>(null);
  const [connections, setConnections] = useState<Record<number, string>>({});
  const logsEndRef = useRef<HTMLDivElement>(null);
  const websocketsRef = useRef<WebSocket[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    for (let i = 0; i < 10; i++) {
      connectToErgRace(i);
    }

    return () => {
      websocketsRef.current.forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    };
  }, []);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const connectToErgRace = (lane: number) => {
    const port = 443 + lane;
    const wsUri = `ws://localhost:${port}`;

    try {
      const ws = new WebSocket(wsUri);

      ws.onopen = () => {
        setConnections(prev => ({ ...prev, [lane]: 'CONNECTED' }));
        addLog(lane, `Connected to ErgRace on port ${port}`, 'connection');
      };

      ws.onclose = () => {
        setConnections(prev => ({ ...prev, [lane]: 'DISCONNECTED' }));
        addLog(lane, `Disconnected from port ${port}`, 'connection');
      };

      ws.onerror = () => {
        setConnections(prev => ({ ...prev, [lane]: 'ERROR' }));
        addLog(lane, `Connection error on port ${port}`, 'error');
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);

          if (data.state !== undefined && data.state_desc !== undefined) {
            setRaceStatus(data);
            addLog(
              lane,
              `Race Status: ${data.state_desc.toUpperCase()} (State ${data.state})`,
              'status'
            );
          } else if (data.SPM !== undefined) {
            const message = `SPM: ${data.SPM}${data.Distance ? `, Distance: ${data.Distance}m` : ''}${data.Time ? `, Time: ${Math.floor(data.Time / 60)}:${(data.Time % 60).toString().padStart(2, '0')}` : ''}${data.Watts ? `, Power: ${data.Watts}W` : ''}`;
            addLog(lane, message, 'data');
          } else {
            addLog(lane, `Raw: ${evt.data}`, 'data');
          }
        } catch (error) {
          addLog(lane, `Parse error: ${evt.data}`, 'error');
        }
      };

      websocketsRef.current[lane] = ws;
    } catch (error) {
      addLog(lane, `Failed to connect to port ${port}`, 'error');
    }
  };

  const addLog = (lane: number, message: string, type: ErgRaceLog['type']) => {
    const log: ErgRaceLog = {
      timestamp: new Date().toISOString(),
      lane,
      message,
      type,
    };
    setLogs(prev => [...prev, log]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type: ErgRaceLog['type']) => {
    switch (type) {
      case 'data':
        return 'text-green-300';
      case 'status':
        return 'text-cyan-400';
      case 'connection':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
  };

  const getConnectionColor = (state: string) => {
    switch (state) {
      case 'CONNECTED':
        return 'text-green-400';
      case 'DISCONNECTED':
        return 'text-gray-500';
      case 'ERROR':
        return 'text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen p-6 bg-black text-green-400">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-400 rounded hover:bg-green-500/40 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-mono font-bold">RETOUR</span>
        </button>

        <div className="mb-6">
          <h1 className="text-4xl font-bold font-mono mb-2 flex items-center gap-3">
            <Radio className="w-10 h-10" />
            ERGRACE MONITOR
          </h1>
          <p className="text-green-300 font-mono">
            Surveillance en temps réel des connexions ErgRace
          </p>
        </div>

        {raceStatus && (
          <div className="mb-6 bg-black/90 border-2 border-cyan-400 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Circle className="w-6 h-6 text-cyan-400 animate-pulse" />
              <div>
                <div className="text-sm text-cyan-300 font-mono">RACE STATUS</div>
                <div className={`text-2xl font-bold font-mono ${RACE_STATES[raceStatus.state]?.color || 'text-gray-400'}`}>
                  {raceStatus.state_desc.toUpperCase()}
                </div>
                <div className="text-sm text-cyan-300 font-mono mt-1">
                  State Code: {raceStatus.state}
                  {raceStatus.data && raceStatus.data.length > 0 && (
                    <span className="ml-2">
                      | Lanes: {raceStatus.data.map(d => d.lane).filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {Array.from({ length: 10 }).map((_, i) => {
            const state = connections[i] || 'DISCONNECTED';
            return (
              <div
                key={i}
                className="bg-black/90 border border-green-400/50 rounded p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold">Lane {i + 1}</span>
                  <span className={`text-xs font-mono ${getConnectionColor(state)}`}>
                    {state}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  Port: {443 + i}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-black/90 border-2 border-green-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-mono">LOGS EN TEMPS RÉEL</h2>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm font-mono cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="accent-green-500"
                />
                Auto-scroll
              </label>
              <button
                onClick={clearLogs}
                className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-400 rounded hover:bg-red-500/40 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Effacer
              </button>
            </div>
          </div>

          <div className="bg-black border border-green-400/30 rounded p-3 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                En attente de données ErgRace...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${getLogColor(log.type)}`}>
                  <span className="text-gray-500">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className="text-yellow-400 mx-2">[Lane {log.lane + 1}]</span>
                  <span className="font-mono">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        <div className="mt-6 bg-green-500/10 border border-green-400/50 rounded-lg p-4">
          <h3 className="font-mono font-bold mb-2">ℹ️ INFORMATIONS</h3>
          <ul className="text-sm font-mono space-y-1 text-green-300">
            <li>• Ports ErgRace: 443-452 (10 lanes max)</li>
            <li>• Types de messages: Données PM5, Statuts de course</li>
            <li>• Les connexions se font automatiquement au chargement</li>
            <li>• Les logs s'accumulent en temps réel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
