import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Download } from 'lucide-react';

type LogEntry = {
  timestamp: string;
  type: 'sent' | 'received' | 'error' | 'connection';
  message: string;
  data?: any;
};

const LED_WS_URL = 'ws://leds-ws-server.under-code.fr:8081';

export const LedsLogsPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    setLogs(prev => [...prev, { timestamp, type, message, data }]);
  };

  const connectWebSocket = () => {
    try {
      addLog('connection', `Tentative de connexion à ${LED_WS_URL}`);
      wsRef.current = new WebSocket(LED_WS_URL);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        addLog('connection', '✅ Connecté au serveur WebSocket LEDs');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addLog('received', 'Message reçu du serveur', data);
        } catch {
          addLog('received', 'Message reçu (non-JSON)', event.data);
        }
      };

      wsRef.current.onerror = (error) => {
        addLog('error', '❌ Erreur WebSocket', error);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        addLog('connection', '❌ Déconnecté du serveur WebSocket LEDs');
      };
    } catch (error) {
      addLog('error', '❌ Erreur lors de la connexion', error);
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logsText = logs.map(log => {
      const dataStr = log.data ? '\n' + JSON.stringify(log.data, null, 2) : '';
      return `[${log.timestamp}][${log.type.toUpperCase()}] ${log.message}${dataStr}`;
    }).join('\n\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leds-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'sent':
        return 'text-blue-400';
      case 'received':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'connection':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'sent':
        return '📤';
      case 'received':
        return '📥';
      case 'error':
        return '❌';
      case 'connection':
        return '🔌';
      default:
        return '📋';
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin-select')}
              className="p-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-green-400 font-mono">
                LOGS WEBSOCKET LEDS
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className={`text-sm font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'CONNECTÉ' : 'DÉCONNECTÉ'}
                </span>
                <span className="text-sm font-mono text-gray-500 ml-2">
                  {LED_WS_URL}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-black font-mono font-bold rounded-lg hover:bg-blue-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              TÉLÉCHARGER
            </button>
            <button
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-4 py-3 bg-red-500 text-black font-mono font-bold rounded-lg hover:bg-red-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              EFFACER
            </button>
          </div>
        </div>

        <div className="bg-black/90 border-2 border-green-500 rounded-lg p-4 h-[calc(100vh-200px)] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 font-mono">
              Aucun log pour le moment... En attente de messages WebSocket
            </div>
          ) : (
            <div className="space-y-2 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="border-b border-gray-800 pb-2">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">{log.timestamp}</span>
                    <span>{getLogIcon(log.type)}</span>
                    <span className={`font-bold ${getLogColor(log.type)}`}>
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="text-gray-300">{log.message}</span>
                  </div>
                  {log.data && (
                    <pre className="mt-2 ml-8 p-2 bg-gray-900 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        <div className="mt-4 text-sm font-mono text-gray-500 text-center">
          Total des logs: {logs.length}
        </div>
      </div>
    </div>
  );
};
