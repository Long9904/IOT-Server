require("dotenv").config();
const aedes = require("aedes")();
const net = require("net");
const ws = require("ws");
const websocketStream = require("websocket-stream");

const MQTT_PORT = process.env.MQTT_BROKER_PORT || 1883;
const WS_PORT = process.env.MQTT_WS_PORT || 8888;

// MQTT (TCP)
const mqttServer = net.createServer(aedes.handle);
mqttServer.listen(MQTT_PORT, () => {
  console.log("MQTT Broker running on TCP port:", MQTT_PORT);
});

// MQTT over WebSocket
const wsServer = new ws.Server({ port: WS_PORT });
wsServer.on("connection", function (socket) {
  websocketStream(socket).pipe(aedes.createStream()).pipe(socket);
});

console.log("MQTT WebSocket running on port:", WS_PORT);

// Log client connections
aedes.on("client", (client) => {
  console.log(`[CONNECT] Device: ${client?.id}`);
});

// Log published messages
aedes.on("publish", (packet, client) => {
  if (client) {
    console.log(`${client.id} → ${packet.topic}: ${packet.payload.toString()}`);
  }
});
