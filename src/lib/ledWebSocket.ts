type LedWebSocketMessage = {
  type: string;
  [key: string]: unknown;
};

type PlayerData = {
  id: number;
  rate: number;
  'target-rate': boolean;
  distance: number;
};

class LedWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private connected = false;
  private messageQueue: LedWebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    try {
      console.log('🔌 Connexion aux panneaux LED...', this.url);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ Connecté aux panneaux LED');
        this.connected = true;
        this.reconnectAttempts = 0;

        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg) this.send(msg);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ Déconnecté des panneaux LED');
        this.connected = false;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Tentative de reconnexion (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          this.reconnectTimeout = window.setTimeout(() => this.connect(), 3000);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Erreur WebSocket LED:', error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as LedWebSocketMessage;
          if (message.type === 'error') {
            console.error('❌ Erreur serveur LED:', message);
          } else if (message.type === 'game_data_processed') {
            console.log('✅ Données LED traitées');
          }
        } catch (error) {
          console.error('Erreur parsing message LED:', error);
        }
      };
    } catch (error) {
      console.error('Erreur création WebSocket LED:', error);
    }
  }

  private send(message: LedWebSocketMessage) {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  sendGlobalCommand(command: string, message: string) {
    this.send({
      type: 'send_global_command',
      command,
      message,
    });
  }

  sendGameData(players: PlayerData[], targetCadence: number) {
    const payload = {
      game: 'nomatrouver',
      'target-rate': targetCadence,
      players: players.map(p => ({
        id: p.id,
        rate: Math.round(p.rate * 100) / 100,
        'target-rate': p['target-rate'],
        distance: Math.round(p.distance * 100) / 100,
      })),
    };

    this.send({
      type: 'send_game_data',
      payload,
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
  }
}

const LED_WS_URL = 'ws://leds-ws-server.under-code.fr:8081';
export const ledWsClient = new LedWebSocketClient(LED_WS_URL);
