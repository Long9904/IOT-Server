require("dotenv").config();

const mqtt = require("mqtt");

// MQTT Broker Configuration
const MQTT_BROKER = process.env.MQTT_BROKER_HOST;
const TELEMETRY_TOPIC = "iot/esp32/telemetry";
const LOCATION_TOPIC = "home/location";
const TIME_TOPIC = "set/clock";

console.log(`Time Server is connecting to MQTT Broker: ${MQTT_BROKER}...`);
const client = mqtt.connect(MQTT_BROKER);

// When connected to MQTT Broker
client.on("connect", function () {
  console.log("MQTT connected successfully!");

  // Subscribe to ESP32 telemetry topic
  client.subscribe(TELEMETRY_TOPIC, function (err) {
    if (!err) {
      console.log(`Subscribed to topic: ${TELEMETRY_TOPIC}`);
    } else {
      console.error("Subscription error:", err);
    }
  });
});

// Error handling
client.on("error", function (error) {
  console.log("MQTT connection error:", error);
});

// Handle incoming messages
client.on("message", function (topic, message) {
  if (topic === TELEMETRY_TOPIC) {
    try {
      // Parse JSON message from ESP32
      const data = JSON.parse(message.toString());
      console.log("-----------------------------");
      console.log("Received telemetry from ESP32:");
      console.log(`Timezone: ${data.timezone}`);
      console.log(`Location: ${data.location}`);

      // 1. Publish location to home/location topic
      if (data.location) {
        client.publish(LOCATION_TOPIC, data.location);
        console.log(
          `Published location to ${LOCATION_TOPIC}: ${data.location}`
        );
      }

      // 2. Calculate and publish time based on timezone offset
      if (data.timezone !== undefined) {
        const timeData = calculateTimeFromOffset(data.timezone);
        const timePayload = JSON.stringify(timeData);

        client.publish(TIME_TOPIC, timePayload);
        console.log(`Published time to ${TIME_TOPIC}:`, timeData);
      }
    } catch (error) {
      console.error("Error parsing telemetry message:", error.message);
    }
  }
});

/**
 * Calculate current time based on UTC offset
 * @param {number} utcOffset - UTC offset in hours (e.g., 7 for UTC+7)
 * @returns {object} Time data object with year, month, day, hour, minute, second, utcOffset
 */
function calculateTimeFromOffset(utcOffset) {
  // Get current UTC time
  const now = new Date();

  // Calculate time with offset
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTime = new Date(utcTime + 3600000 * utcOffset);

  return {
    year: localTime.getFullYear(),
    month: localTime.getMonth() + 1, // JavaScript months are 0-indexed
    day: localTime.getDate(),
    hour: localTime.getHours(),
    minute: localTime.getMinutes(),
    second: localTime.getSeconds(),
    utcOffset: utcOffset,
  };
}

// Graceful shutdown
process.on("SIGINT", function () {
  console.log("\nShutting down gracefully...");
  client.end();
  process.exit();
});
