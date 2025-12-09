require("dotenv").config();

const mqtt = require("mqtt");
const axios = require("axios");

// --- CẤU HÌNH ---
// 1. Thông tin MQTT Broker
const MQTT_BROKER = process.env.MQTT_BROKER_HOST;
const MQTT_TOPIC = "home/weather";

// 2. Thông tin Thời tiết (OpenWeatherMap)
const API_KEY = process.env.WEATHER_API_KEY;
const CITY = "Thu Duc";
const COUNTRY_CODE = "VN";

// Tạo đường link gọi API
const WEATHER_URL = `http://api.openweathermap.org/data/2.5/weather?q=${CITY},${COUNTRY_CODE}&appid=${API_KEY}&units=metric&lang=vi`;

// --- KẾT NỐI ---
console.log(`📡 Đang kết nối tới Broker: ${MQTT_BROKER}...`);
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", function () {
  console.log("Đã kết nối MQTT thành công!");

  // Gọi hàm lấy thời tiết ngay lập tức
  fetchWeatherAndPublish();

  // Timer: 60s if not specified
  setInterval(fetchWeatherAndPublish, process.env.WEATHER_TIME_DELAY || 60000);
});

client.on("error", function (error) {
  console.log("Lỗi kết nối MQTT:", error);
});

// --- HÀM XỬ LÝ CHÍNH ---
async function fetchWeatherAndPublish() {
  try {
    // 1. Gọi API lấy thời tiết
    const response = await axios.get(WEATHER_URL);
    const data = response.data;

    // 2. Lọc lấy thông tin cần thiết
    const weatherInfo = {
      city: data.name,
      temp: data.main.temp, // Nhiệt độ
      humidity: data.main.humidity, // Độ ẩm
      desc: data.weather[0].description, // Mô tả (vd: mây cụm, mưa nhẹ)
    };

    // 3. In ra màn hình console (Server)
    console.log("-----------------------------");
    console.log(`📍 Tại: ${weatherInfo.city}`);
    console.log(`🌡️ Nhiệt độ: ${weatherInfo.temp}°C`);
    console.log(`💧 Độ ẩm: ${weatherInfo.humidity}%`);
    console.log(`☁️ Tình trạng: ${weatherInfo.desc}`);

    // 4. Gửi xuống MQTT (Publish)
    // Convert to JSON string
    const payload = JSON.stringify(weatherInfo);
    client.publish(MQTT_TOPIC, payload);

    console.log(`Đã gửi dữ liệu xuống topic: ${MQTT_TOPIC}`);
  } catch (error) {
    console.error(
      "Lỗi khi lấy thời tiết:",
      error.response ? error.response.statusText : error.message
    );
    console.log("Gợi ý: Kiểm tra lại API KEY xem đúng chưa?");
  }
}
