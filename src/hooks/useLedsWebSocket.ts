import { useEffect, useRef } from 'react';
import { Participant } from '../lib/types';

const LED_WS_URL = 'ws://leds-ws-server.under-code.fr:8081';
const LED_GAME_NAME = 'nomatrouver';

type LedsWebSocketConfig = {
  participants: Participant[];
  targetCadence: number;
  tolerance: number;
  isActive: boolean;
};

export const useLedsWebSocket = ({ participants, targetCadence, tolerance, isActive }: LedsWebSocketConfig) => {
  const wsRef = useRef<WebSocket | null>(null);
  const lastSentDataRef = useRef<string>('');

  useEffect(() => {
    if (!isActive) return;

    console.log('🔌 Connexion au serveur LEDs:', LED_WS_URL);
    wsRef.current = new WebSocket(LED_WS_URL);

    wsRef.current.onopen = () => {
      console.log('✅ LEDs: Connecté au serveur WebSocket');
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ LEDs: Erreur WebSocket:', error);
    };

    wsRef.current.onclose = () => {
      console.log('❌ LEDs: Déconnecté du serveur WebSocket');
    };

    wsRef.current.onmessage = (event) => {
      console.log('📥 LEDs: Message reçu du serveur:', event.data);
    };

    return () => {
      if (wsRef.current) {
        console.log('🔌 Fermeture de la connexion LEDs');
        wsRef.current.close();
      }
    };
  }, [isActive]);

  const sendToLeds = (customParticipants?: Participant[]) => {
    const participantsToSend = customParticipants || participants;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ LEDs: WebSocket non connecté, impossible d\'envoyer les données');
      return;
    }

    const players = participantsToSend.map((participant, index) => {
      const isInCadence =
        participant.current_cadence >= (targetCadence - tolerance) &&
        participant.current_cadence <= (targetCadence + tolerance);

      return {
        id: index + 1,
        rate: participant.current_cadence,
        'target-rate': isInCadence,
        distance: participant.total_distance_in_cadence
      };
    });

    const gameData = {
      type: 'send_game_data',
      payload: {
        game: LED_GAME_NAME,
        players: players
      }
    };

    const dataString = JSON.stringify(gameData);

    // Ne log que si les données ont changé pour éviter de polluer les logs
    if (dataString !== lastSentDataRef.current) {
      console.log('📤 LEDs: Envoi des données:', gameData);
      lastSentDataRef.current = dataString;
    }

    wsRef.current.send(dataString);
  };

  return { sendToLeds };
};
