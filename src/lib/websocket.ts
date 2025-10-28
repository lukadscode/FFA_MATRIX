import { Race, Participant, CadenceEvent } from './types';

type WebSocketMessage = {
  type: string;
  [key: string]: unknown;
};

type SubscriptionCallback = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  private reconnectTimeout: number | null = null;
  private messageQueue: string[] = [];
  private connected = false;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.connected = true;

        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg) this.ws?.send(msg);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        this.connected = false;
        this.reconnectTimeout = window.setTimeout(() => this.connect(), 2000);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          const subscribers = this.subscriptions.get(message.type);
          if (subscribers) {
            subscribers.forEach(callback => callback(message));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }

  subscribe(type: string, callback: SubscriptionCallback) {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
    }
    this.subscriptions.get(type)?.add(callback);

    return () => {
      this.subscriptions.get(type)?.delete(callback);
    };
  }

  send(message: WebSocketMessage) {
    const msg = JSON.stringify(message);
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.messageQueue.push(msg);
    }
  }

  async createRace(race: Omit<Race, 'id' | 'created_at'>): Promise<Race | null> {
    return new Promise((resolve) => {
      const unsubscribe = this.subscribe('raceCreated', (message) => {
        unsubscribe();
        resolve(message.data as Race);
      });

      this.send({
        type: 'createRace',
        race: {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...race,
        },
      });

      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  }

  async getRace(id: string): Promise<Race | null> {
    return new Promise((resolve) => {
      const unsubscribe = this.subscribe('race', (message) => {
        unsubscribe();
        resolve(message.data as Race);
      });

      this.send({ type: 'getRace', id });

      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  }

  async updateRace(id: string, updates: Partial<Race>): Promise<Race | null> {
    return new Promise((resolve) => {
      const unsubscribe = this.subscribe('raceUpdated', (message) => {
        unsubscribe();
        resolve(message.data as Race);
      });

      this.send({ type: 'updateRace', id, updates });

      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  }

  async createParticipant(participant: Omit<Participant, 'id' | 'created_at'>): Promise<Participant | null> {
    return new Promise((resolve) => {
      const unsubscribe = this.subscribe('participantCreated', (message) => {
        unsubscribe();
        resolve(message.data as Participant);
      });

      this.send({
        type: 'createParticipant',
        participant: {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...participant,
        },
      });

      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  }

  async getParticipants(raceId: string): Promise<Participant[]> {
    return new Promise((resolve) => {
      const unsubscribe = this.subscribe('participants', (message) => {
        unsubscribe();
        resolve(message.data as Participant[]);
      });

      this.send({ type: 'getParticipants', raceId });

      setTimeout(() => {
        unsubscribe();
        resolve([]);
      }, 5000);
    });
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant | null> {
    return new Promise((resolve) => {
      const unsubscribe = this.subscribe('participantUpdated', (message) => {
        unsubscribe();
        resolve(message.data as Participant);
      });

      this.send({ type: 'updateParticipant', id, updates });

      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
  }
}

const WS_HOST = import.meta.env.VITE_WS_HOST || 'localhost';
const WS_URL = `ws://${WS_HOST}:8081`;
export const wsClient = new WebSocketClient(WS_URL);
