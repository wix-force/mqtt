import mqtt from "mqtt";

// HiveMQ public broker
const MQTT_URL = "mqtt://broker.hivemq.com:1883";
const TOPIC = "home/sensor1/data";

// Connect to MQTT broker
const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log("✅ Publisher connected to broker:", MQTT_URL);

  // Publish fake sensor data every 3 seconds
  setInterval(() => {
    const data = {
      temperature: (20 + Math.random() * 10).toFixed(2), // 20-30°C
      humidity: (40 + Math.random() * 20).toFixed(2),    // 40-60%
      ts: new Date().toISOString()
    };

    client.publish(TOPIC, JSON.stringify(data));
    console.log("📤 Published:", data);
  }, 1000); // every 1 seconds
});

client.on("error", (err) => console.error("❌ MQTT Publisher error:", err));
client.on("reconnect", () => console.log("🔄 MQTT Publisher reconnecting..."));
