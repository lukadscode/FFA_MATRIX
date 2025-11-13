import { WebSocketServer, WebSocket } from "ws";
import {
  getRace,
  getActiveRace,
  getAllRaces,
  createRace,
  updateRace,
  deleteRace,
  getParticipants,
  getParticipant,
  createParticipant,
  updateParticipant,
  deleteParticipants,
  createCadenceEvent,
  getCadenceEvents,
} from "./database.js";

import { networkInterfaces } from 'os';

const WS_PORT = 8081;
const wss = new WebSocketServer({ port: WS_PORT, host: '0.0.0.0' });

const clients = new Set();

const LED_SERVER_URL = 'ws://leds-ws-server.under-code.fr:8081';
let ledClient = null;
let reconnectTimeout = null;

function connectToLEDServer() {
  try {
    ledClient = new WebSocket(LED_SERVER_URL);

    ledClient.on('open', () => {
      console.log('✅ Connected to LED server:', LED_SERVER_URL);
    });

    ledClient.on('error', (error) => {
      console.error('❌ LED server connection error:', error.message);
    });

    ledClient.on('close', () => {
      console.log('🔌 Disconnected from LED server. Reconnecting in 5s...');
      ledClient = null;
      reconnectTimeout = setTimeout(connectToLEDServer, 5000);
    });
  } catch (error) {
    console.error('❌ Failed to connect to LED server:', error.message);
    reconnectTimeout = setTimeout(connectToLEDServer, 5000);
  }
}

function sendToLEDServer(message) {
  if (ledClient && ledClient.readyState === WebSocket.OPEN) {
    try {
      ledClient.send(JSON.stringify(message));
      console.log('📤 Sent to LED server:', message.type);
    } catch (error) {
      console.error('❌ Failed to send to LED server:', error.message);
    }
  } else {
    console.warn('⚠️  LED server not connected, message not sent');
  }
}

connectToLEDServer();

function getLocalIPAddress() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIPAddress();
console.log(`🚀 WebSocket server running on:`);
console.log(`   - Local: ws://localhost:${WS_PORT}`);
console.log(`   - Network: ws://${localIP}:${WS_PORT}`);

function broadcast(message, excludeClient = null) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client !== excludeClient && client.readyState === 1) {
      client.send(data);
    }
  });
}

function convertDbBooleans(obj) {
  if (!obj) return obj;
  const converted = { ...obj };
  if ("is_in_cadence" in converted) {
    converted.is_in_cadence = Boolean(converted.is_in_cadence);
  }
  if ("was_in_cadence" in converted) {
    converted.was_in_cadence = Boolean(converted.was_in_cadence);
  }
  return converted;
}

wss.on("connection", (ws) => {
  console.log("✅ New client connected");
  clients.add(ws);

  ws.send(
    JSON.stringify({
      type: "connected",
      message: "Connected to race server",
    })
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("📨 Received:", data.type);

      let response = null;
      let broadcastMessage = null;

      switch (data.type) {
        case "getRace": {
          const race = getRace(data.id);
          response = { type: "race", data: race };
          break;
        }

        case "getActiveRace": {
          const race = getActiveRace();
          response = { type: "activeRace", data: race };
          break;
        }

        case "getAllRaces": {
          const races = getAllRaces();
          response = { type: "allRaces", data: races };
          break;
        }

        case "createRace": {
          const race = createRace(data.race);
          response = { type: "raceCreated", data: race };
          broadcastMessage = { type: "raceUpdate", data: race };
          break;
        }

        case "updateRace": {
          const race = updateRace(data.id, data.updates);
          response = { type: "raceUpdated", data: race };
          broadcastMessage = { type: "raceUpdate", data: race };
          break;
        }

        case "deleteRace": {
          deleteRace(data.id);
          response = { type: "raceDeleted", id: data.id };
          broadcastMessage = { type: "raceDeleted", id: data.id };
          break;
        }

        case "getParticipants": {
          const participants = getParticipants(data.raceId).map(
            convertDbBooleans
          );
          response = { type: "participants", data: participants };
          break;
        }

        case "createParticipant": {
          const participant = createParticipant(data.participant);
          response = {
            type: "participantCreated",
            data: convertDbBooleans(participant),
          };
          broadcastMessage = {
            type: "participantUpdate",
            data: convertDbBooleans(participant),
          };
          break;
        }

        case "updateParticipant": {
          const participant = updateParticipant(data.id, data.updates);
          response = {
            type: "participantUpdated",
            data: convertDbBooleans(participant),
          };
          broadcastMessage = {
            type: "participantUpdate",
            data: convertDbBooleans(participant),
          };
          break;
        }

        case "deleteParticipants": {
          deleteParticipants(data.raceId);
          response = { type: "participantsDeleted", raceId: data.raceId };
          broadcastMessage = {
            type: "participantsDeleted",
            raceId: data.raceId,
          };
          break;
        }

        case "createCadenceEvent": {
          const event = createCadenceEvent(data.event);
          response = {
            type: "cadenceEventCreated",
            data: convertDbBooleans(event),
          };
          broadcastMessage = {
            type: "cadenceEventUpdate",
            data: convertDbBooleans(event),
          };
          break;
        }

        case "getCadenceEvents": {
          const events = getCadenceEvents(data.raceId).map(convertDbBooleans);
          response = { type: "cadenceEvents", data: events };
          break;
        }

        case "subscribe": {
          response = { type: "subscribed", channel: data.channel };
          break;
        }

        case "send_global_command": {
          console.log(`📢 Global command received: ${data.command}`);

          // Forward to LED server
          sendToLEDServer({
            type: "send_global_command",
            command: data.command,
            message: data.message || data.command
          });

          // Broadcast to all connected clients
          broadcastMessage = {
            type: "globalCommand",
            command: data.command,
            message: data.message || data.command
          };

          response = { type: "command_sent", command: data.command };
          break;
        }

        case "send_game_data": {
          console.log(`🎮 Game data received: ${data.payload.game}, ${data.payload.players.length} players`);

          // Get active race
          const activeRace = getActiveRace();

          if (!activeRace) {
            console.warn("⚠️  No active race found");
            response = { type: "error", message: "No active race found" };
            break;
          }

          // Get all participants for the active race
          const participants = getParticipants(activeRace.id);

          if (participants.length === 0) {
            console.warn("⚠️  No participants found for active race");
            response = { type: "error", message: "No participants found" };
            break;
          }

          // Map simulator players to database participants
          let updatedCount = 0;
          data.payload.players.forEach((player) => {
            // Find participant by index (player.id - 1 since player IDs start at 1)
            const participantIndex = player.id - 1;

            if (participantIndex >= 0 && participantIndex < participants.length) {
              const participant = participants[participantIndex];

              // Update participant data
              updateParticipant(participant.id, {
                current_cadence: Math.round(player.rate),
                is_in_cadence: player['target-rate'] ? 1 : 0,
                total_distance_in_cadence: player.distance
              });

              updatedCount++;
            }
          });

          console.log(`✅ Updated ${updatedCount} participants`);

          // Forward to LED server immediately
          sendToLEDServer(data);

          // Broadcast updated participants to all clients
          const updatedParticipants = getParticipants(activeRace.id).map(convertDbBooleans);
          broadcastMessage = {
            type: "participantsUpdate",
            data: updatedParticipants
          };

          response = {
            type: "game_data_processed",
            updated: updatedCount,
            raceId: activeRace.id
          };
          break;
        }

        default:
          response = { type: "error", message: "Unknown message type" };
      }

      if (response) {
        ws.send(JSON.stringify(response));
      }

      if (broadcastMessage) {
        broadcast(broadcastMessage, ws);
      }
    } catch (error) {
      console.error("❌ Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: error.message,
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("👋 Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
  });
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  if (ledClient) {
    ledClient.close();
    console.log("✅ LED client connection closed");
  }

  wss.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
