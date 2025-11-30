// publisher.js
import mqtt from "mqtt";

const BROKER = "mqtt://broker.hivemq.com:1883";
const TOPIC = "home/sensor1/data";

const client = mqtt.connect(BROKER, {
  clientId: "publisher_" + Date.now(),
  clean: true,
});

client.on("connect", () => {
  console.log("🚀 Publisher Connected to MQTT");

  setInterval(() => {
    const data = {
      temperature: (20 + Math.random() * 10).toFixed(2),
      humidity: (40 + Math.random() * 20).toFixed(2),
      ts: new Date(),
    };

    client.publish(TOPIC, JSON.stringify(data));
    console.log("📤 Published:", data);
  }, 2000); // publish every 2 seconds
});
