require("dotenv").config();

const mqtt = require("mqtt");
const axios = require("axios");

// 1. Setting MQTT Broker
const MQTT_BROKER = process.env.MQTT_BROKER_HOST;
const MQTT_TOPIC = "home/air-quality";

const API_KEY = process.env.WEATHER_API_KEY;
var CITY = "Thu Duc";
const COUNTRY_CODE = "VN";

console.log(`Air Quality is connecting to MQTT Broker: ${MQTT_BROKER}...`);
const client = mqtt.connect(MQTT_BROKER);

// When connected to MQTT Broker
client.on("connect", function () {
  console.log("MQTT connected successfully!");

  // Register subcribe to topic for location updates
  client.subscribe("home/weather/location");

  // Initial fetch and publish
  getAirQuality(CITY);

  // Timer: 60s if not specified
  setInterval(
    () => getAirQuality(CITY),
    process.env.AIR_QUALITY_DELAY || 60000
  );
});

// Error handling
client.on("error", function (error) {
  console.log("Air Quality & MQTT connection error  :", error);
});

// Update location function
client.on("message", function (topic, message) {
  if (topic === "home/location") {
    const newCity = message.toString();
    console.log(`Updating location to: ${newCity}`);
    CITY = newCity;
  }
});

async function getAirQuality(city) {
  try {
    // 1. Get coordinates
    const geoURL = `http://api.openweathermap.org/geo/1.0/direct?q=${city},VN&limit=1&appid=${API_KEY}`;
    const geoRes = await axios.get(geoURL);

    if (geoRes.data.length === 0) {
      console.log("City not found.");
      return;
    }

    const { lat, lon } = geoRes.data[0];

    // 2. Air pollution API
    const airURL = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const airRes = await axios.get(airURL);

    const info = airRes.data.list[0];
    const payload = {
      city: city,
      aqi: info.main.aqi,
      components: info.components,
    };

    // Publish to MQTT Broker
    client.publish(MQTT_TOPIC, JSON.stringify(payload));

    // Print to console
    console.log("-----------------------------");
    console.log(CITY);
    console.log("AQI Level:", info.main.aqi);
    console.log("Components:", info.components);
  } catch (err) {
    console.log("Error:", err.message);
  }
}
