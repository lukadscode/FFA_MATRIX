import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = 8080;

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

let currentRace = null;
let participants = new Map();

const broadcast = (message, excludeClient = null) => {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== excludeClient && client.readyState === 1) {
      client.send(data);
    }
  });
};

wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  if (currentRace) {
    ws.send(JSON.stringify({ type: 'race_state', data: currentRace }));
  }

  if (participants.size > 0) {
    ws.send(JSON.stringify({
      type: 'participants_state',
      data: Array.from(participants.values())
    }));
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'create_race':
          currentRace = data.data;
          participants.clear();
          broadcast({ type: 'race_created', data: currentRace }, ws);
          console.log('🏁 Race created:', currentRace.name);
          break;

        case 'add_participant':
          participants.set(data.data.id, data.data);
          broadcast({ type: 'participant_added', data: data.data }, ws);
          console.log('👤 Participant added:', data.data.name);
          break;

        case 'update_race':
          if (currentRace && currentRace.id === data.data.id) {
            currentRace = { ...currentRace, ...data.data };
            broadcast({ type: 'race_updated', data: currentRace }, ws);
            console.log('🔄 Race updated');
          }
          break;

        case 'update_participant':
          if (participants.has(data.data.id)) {
            participants.set(data.data.id, data.data);
            broadcast({ type: 'participant_updated', data: data.data }, ws);
          }
          break;

        case 'end_race':
          if (currentRace && currentRace.id === data.raceId) {
            broadcast({ type: 'race_ended', raceId: data.raceId }, ws);
            console.log('🏁 Race ended');
          }
          break;

        case 'get_state':
          if (currentRace) {
            ws.send(JSON.stringify({ type: 'race_state', data: currentRace }));
          }
          if (participants.size > 0) {
            ws.send(JSON.stringify({
              type: 'participants_state',
              data: Array.from(participants.values())
            }));
          }
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sync Server running on ws://0.0.0.0:${PORT}`);
  console.log(`📱 Other devices can connect to ws://YOUR_IP:${PORT}`);
  console.log(`💡 Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)`);
});
