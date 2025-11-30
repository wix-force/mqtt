import mqtt from "mqtt";

const MQTT_URL = "mqtt://broker.hivemq.com:1883";
const TOPIC = "home/sensor2/data";

const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log("✅ Publisher2 connected to broker");

  setInterval(() => {
    const data = {
      temperature: (15 + Math.random() * 15).toFixed(2), // 15-30°C
      humidity: (30 + Math.random() * 30).toFixed(2),    // 30-60%
      ts: new Date().toISOString()
    };

    client.publish(TOPIC, JSON.stringify(data));
    console.log("📤 Published sensor2:", data);
  }, 5000); // every 5 seconds
});
