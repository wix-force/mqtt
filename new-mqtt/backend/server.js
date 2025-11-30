// backend/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import mqtt from "mqtt";
import Sensor from "./models/Sensor.js";

const {
    MONGO_URI = "mongodb://127.0.0.1:27017/mqtt_realtime",
    MQTT_URL = "mqtt://broker.hivemq.com:1883",
    MQTT_TOPIC = "home/sensor1/data",
    PORT = 4000
} = process.env;

// ----- Express + Socket.IO setup -----
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: "*" } });

// ----- APIs -----
app.get("/api/latest/:n?", async (req, res) => {
    const n = Math.max(1, Math.min(1000, Number(req.params.n || 50)));
    try {
        const docs = await Sensor.find().sort({ receivedAt: -1 }).limit(n).lean();
        console.log(`📦 Sending last ${docs.length} documents`);
        res.json(docs.reverse());
    } catch (err) {
        console.error("DB fetch error:", err);
        res.status(500).json({ error: "DB fetch error" });
    }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

// ----- MongoDB connect -----
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, {});
        console.log("✅ MongoDB connected:", MONGO_URI);
    } catch (err) {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    }
}
connectDB();

// ----- MQTT subscriber -----
const mqttClient = mqtt.connect(MQTT_URL, {
    clientId: "backend_sub_" + Math.random().toString(16).slice(2),
    clean: true,
    reconnectPeriod: 5000
});

mqttClient.on("connect", () => {
    console.log("🔗 Connected to MQTT broker:", MQTT_URL);
    mqttClient.subscribe(MQTT_TOPIC, { qos: 0 }, (err, granted) => {
        if (err) console.error("❌ Subscribe error:", err);
        else console.log("📡 Subscribed to topic:", MQTT_TOPIC, "granted:", granted);
    });
});

mqttClient.on("reconnect", () => console.log("🔄 MQTT reconnecting..."));
mqttClient.on("error", (err) => console.error("❌ MQTT error:", err));

mqttClient.on("message", async (topic, buffer) => {
    console.log("📩 RAW MQTT MESSAGE:", buffer.toString());
    try {
        let payload;
        try {
            payload = JSON.parse(buffer.toString());
            console.log("📝 Parsed payload:", payload);
        } catch (e) {
            console.warn("⚠️ Invalid JSON payload, saving raw message");
            payload = { raw: buffer.toString() };
        }

        const doc = new Sensor({
            temperature: payload.temperature != null ? Number(payload.temperature) : null,
            humidity: payload.humidity != null ? Number(payload.humidity) : null,
            ts: payload.ts ? new Date(payload.ts) : new Date(),
            topic,
            receivedAt: new Date()
        });

        const saved = await doc.save();
        console.log("💾 Saved to MongoDB:", saved);

        io.emit("sensor-data", {
            _id: saved._id,
            temperature: saved.temperature,
            humidity: saved.humidity,
            ts: saved.ts,
            receivedAt: saved.receivedAt
        });
        console.log("🚀 Emitted to frontend:", saved._id);
    } catch (err) {
        console.error("❌ Message handling error:", err);
    }
});

// ----- Socket.IO connections -----
io.on("connection", (socket) => {
    console.log("🟢 Frontend connected, id:", socket.id);
    socket.on("disconnect", () => console.log("🔴 Frontend disconnected, id:", socket.id));
});

// ----- Start server -----
server.listen(PORT, () => {
    console.log(`🚀 Backend listening on http://localhost:${PORT}`);
});
