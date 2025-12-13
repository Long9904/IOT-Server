require("dotenv").config();

const mqtt = require("mqtt");
const axios = require("axios");

// 1. Setting MQTT Broker
const MQTT_BROKER = process.env.MQTT_BROKER_HOST;
const MQTT_TOPIC = "out/weather";

// 2. Weather Information (OpenWeatherMap)
const API_KEY = process.env.WEATHER_API_KEY;
var CITY = "Thu Duc";
const COUNTRY_CODE = "VN";

console.log(`Weather Station is connecting to MQTT Broker: ${MQTT_BROKER}...`);
const client = mqtt.connect(MQTT_BROKER);

// When connected to MQTT Broker
client.on("connect", function () {
  console.log("MQTT connected successfully!");

  // Register subcribe to topic for location updates
  client.subscribe("home/location");

  // Initial fetch and publish
  fetchWeatherAndPublish();

  // Timer: 60s if not specified
  setInterval(fetchWeatherAndPublish, process.env.WEATHER_TIME_DELAY || 60000);
});

// Error handling
client.on("error", function (error) {
  console.log("Weather Station & MQTT connection error  :", error);
});

// Update location function
client.on("message", function (topic, message) {
  if (topic === "home/location") {
    const newCity = message.toString();
    console.log(`Updating location to: ${newCity}`);
    CITY = newCity;
    fetchWeatherAndPublish();
  }
});

async function fetchWeatherAndPublish() {
  try {
    const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?q=${CITY},${COUNTRY_CODE}&appid=${API_KEY}&units=metric&lang=en`;
    // 1. Call API to get weather data
    const response = await axios.get(WEATHER_URL);
    const data = response.data;

    // 2. Filter necessary information
    const weatherInfo = {
      city: data.name,
      temp: data.main.temp, // Temperature
      humidity: data.main.humidity, // Humidity
      desc: data.weather[0].description, // Description (e.g., scattered clouds, light rain)
    };

    // 3. Print to console (Server)
    console.log("-----------------------------");
    console.log(`Location: ${weatherInfo.city}`);
    console.log(`Temperature: ${weatherInfo.temp}°C`);
    console.log(`Humidity: ${weatherInfo.humidity}%`);
    console.log(`Condition: ${weatherInfo.desc}`);

    // 4. Publish to MQTT Broker
    // Convert to JSON string
    const payload = JSON.stringify(weatherInfo);
    client.publish(MQTT_TOPIC, payload);

    console.log(`Data published to topic: ${MQTT_TOPIC}`);
  } catch (error) {
    console.error(
      "Error fetching weather data:",
      error.response ? error.response.statusText : error.message
    );
    console.log("Hint: Check if the API KEY is correct.");
  }
}
