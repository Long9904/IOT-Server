require("dotenv").config();
const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const port = process.env.MQTT_BROKER_PORT;

// Start MQTT Broker server
server.listen(port, function () {
  console.log("MQTT Broker (server.js) is running on port:", port);
});

// When a device connects
aedes.on("client", function (client) {
  console.log(`[CONNECT] New device: ${client ? client.id : client}`);
});

// When a message is published- take message payload from publish event
aedes.on("publish", function (packet, client) {
  if (client) {
    console.log(
      `📩 Received message from [${client.id}]: ${packet.payload.toString()}`
    );
  }
});
