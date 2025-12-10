require("dotenv").config();
const aedes = require("aedes")();
const net = require("net");
const http = require("http");
const ws = require("ws");

// MQTT TCP (cho ESP32)
const MQTT_PORT = process.env.MQTT_BROKER_PORT || 1883;
const mqttServer = net.createServer(aedes.handle);

mqttServer.listen(MQTT_PORT, () => {
  console.log("Aedes MQTT running on TCP port:", MQTT_PORT);
});

// MQTT WebSocket (cho React)
const WS_PORT = process.env.MQTT_WS_PORT || 9001;
const httpServer = http.createServer();
const wss = new ws.Server({ server: httpServer });

wss.on("connection", (socket) => {
  const stream = ws.createWebSocketStream(socket);
  aedes.handle(stream);
});

httpServer.listen(WS_PORT, () => {
  console.log("Aedes MQTT WebSocket running on:", WS_PORT);
});

// Logging
aedes.on("client", (client) => {
  console.log(`Client connected: ${client.id}`);
});

aedes.on("publish", (packet, client) => {
  if (client) {
    console.log(`[${client.id}] → ${packet.topic}: ${packet.payload}`);
  }
});
