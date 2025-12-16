require("dotenv").config();
const mqtt = require("mqtt");

// ===== MQTT CONFIG =====
const MQTT_BROKER = process.env.MQTT_BROKER_HOST;
const TELEMETRY_TOPIC = "iot/esp32/telemetry";
const LOCATION_TOPIC = "home/location";
const TIME_TOPIC = "set/clock";

console.log(`Time Server connecting to MQTT Broker: ${MQTT_BROKER}`);
const client = mqtt.connect(MQTT_BROKER);

// ===== MQTT CONNECT =====
client.on("connect", () => {
  console.log("MQTT connected successfully!");

  client.subscribe(TELEMETRY_TOPIC, (err) => {
    if (!err) {
      console.log(`Subscribed to ${TELEMETRY_TOPIC}`);
    } else {
      console.error("Subscribe error:", err);
    }
  });
});

// ===== ERROR =====
client.on("error", (error) => {
  console.error("MQTT error:", error);
});

// ===== RECEIVE DATA =====
client.on("message", (topic, message) => {
  if (topic !== TELEMETRY_TOPIC) return;

  try {
    const raw = message.toString();
    console.log("\nRAW telemetry:", raw);

    const data = JSON.parse(raw);
    console.log("Parsed telemetry:", data);

    // ===== LOCATION =====
    if (typeof data.location === "string" && data.location !== "NA") {
      client.publish(LOCATION_TOPIC, data.location);
      console.log(`Published location: ${data.location}`);
    }

    // ===== TIMEZONE =====
    const offset = parseUtcOffset(data.timezone);

    if (offset !== null) {
      const timeData = calculateTimeFromOffset(offset);
      client.publish(TIME_TOPIC, JSON.stringify(timeData));
      console.log("Published time:", timeData);
    } else {
      console.warn("Invalid timezone format:", data.timezone);
    }
  } catch (err) {
    console.error("JSON parse error:", err.message);
  }
});

// ===== PARSE UTC STRING =====
function parseUtcOffset(utcString) {
  if (typeof utcString !== "string") return null;

  // Match: UTC+07, UTC-5, UTC+07 Vietnam
  const match = utcString.match(/UTC\s*([+-])\s*(\d{1,2})/i);
  if (!match) return null;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = parseInt(match[2], 10);

  if (hours > 14) return null; // safety

  return sign * hours;
}

// ===== CALCULATE TIME =====
function calculateTimeFromOffset(utcOffset) {
  const now = new Date();

  // UTC time
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTime = new Date(utcTime + utcOffset * 3600000);

  return {
    year: localTime.getFullYear(),
    month: localTime.getMonth() + 1,
    day: localTime.getDate(),
    hour: localTime.getHours(),
    minute: localTime.getMinutes(),
    second: localTime.getSeconds(),
    utcOffset: utcOffset,
  };
}

// ===== GRACEFUL SHUTDOWN =====
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  client.end();
  process.exit();
});
