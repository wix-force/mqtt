import dotenv from "dotenv";
dotenv.config();

import mqtt from "mqtt";
import mongoose from "mongoose";
import Sensor from "./models/Sensor.js";

const {
  MONGO_URI = "mongodb://127.0.0.1:27017/mqttDemo",
  MQTT_URL = "mqtt://broker.hivemq.com:1883",
  MQTT_TOPIC = "home/sensor1/data",
} = process.env;

async function start() {
  // -------------------------
  // 1) CONNECT MONGODB
  // -------------------------
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  // -------------------------
  // 2) CONNECT MQTT
  // -------------------------
  const client = mqtt.connect(MQTT_URL, {
    clean: true,
    reconnectPeriod: 5000, // 5 sec reconnect
    keepalive: 60,
    connectTimeout: 30 * 1000,
    // IMPORTANT → Create unique client ID
    clientId: "subscriber_" + Math.random().toString(16).slice(2),
  });

  client.on("connect", () => {
    console.log("✅ Connected to MQTT broker:", MQTT_URL);

    // PUBLIC BROKER FIX → always use qos: 0
    client.subscribe(MQTT_TOPIC, { qos: 0 }, (err, granted) => {
      if (err) {
        return console.error("❌ Subscribe failed:", err);
      }
      console.log("📌 Subscribed:", granted);
    });
  });

  client.on("reconnect", () => {
    console.log("🔄 Reconnecting...");
  });

  client.on("error", (err) => {
    console.error("❌ MQTT Error:", err);
  });

  // -------------------------
  // 3) RECEIVE MESSAGE + SAVE DB
  // -------------------------
  client.on("message", async (topic, messageBuffer) => {
    try {
      const msg = messageBuffer.toString();
      console.log("📩 Received:", msg);

      let payload;
      try {
        payload = JSON.parse(msg);
      } catch {
        payload = msg;
      }

      await Sensor.create({
        topic,
        payload,
        receivedAt: new Date(),
      });

      console.log("💾 Saved to DB");
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });
}

start().catch((err) => {
  console.error("❌ Startup error:", err);
});
