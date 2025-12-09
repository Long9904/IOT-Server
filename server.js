require("dotenv").config();
const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const port = process.env.MQTT_BROKER_PORT;

// Khởi động Server lắng nghe ở port
server.listen(port, function () {
  console.log("MQTT Broker (server.js) đang chạy trên port:", port);
});

// Khi có thiết bị kết nối
aedes.on("client", function (client) {
  console.log(`[CONNECT] Thiết bị mới: ${client ? client.id : client}`);
});

// Khi có tin nhắn gửi lên
aedes.on("publish", function (packet, client) {
  if (client) {
    console.log(`📩 Nhận tin từ [${client.id}]: ${packet.payload.toString()}`);
  }
});
