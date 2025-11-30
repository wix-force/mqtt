// subscriber.js
import mqtt from "mqtt";
import mongoose from "mongoose";
import SensorModel from "./models/Sensor.js";

// ======================
// MongoDB Connect
// ======================
async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/mqtt_demo");
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
  }
}
connectDB();

// ======================
// MQTT Broker Setup
// ======================
const BROKER = "mqtt://broker.hivemq.com:1883";
const TOPIC = "home/sensor1/data";

const client = mqtt.connect(BROKER, {
  clientId: "subscriber_" + Date.now(),
  clean: true,
  reconnectPeriod: 2000,
});

// ======================
// MQTT Events
// ======================
client.on("connect", () => {
  console.log("🔗 Connected to MQTT:", BROKER);

  client.subscribe(TOPIC, (err, granted) => {
    if (err) console.error("❌ Subscription Failed:", err);
    else console.log("📡 Subscribed:", granted);
  });
});

client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log("📥 Received:", data);

    // Save to DB
    const saved = await SensorModel.create(data);
    console.log("💾 Saved to MongoDB:", saved._id);
  } catch (err) {
    console.error("❌ Error saving message:", err);
  }
});

client.on("reconnect", () => console.log("🔄 Reconnecting..."));
client.on("error", (err) => console.log("❌ MQTT Error:", err));
