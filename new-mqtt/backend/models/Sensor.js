// backend/models/Sensor.js
import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  ts: { type: Date, default: () => new Date() },
  topic: String,
  receivedAt: { type: Date, default: () => new Date() }
});

export default mongoose.models.Sensor || mongoose.model("Sensor", sensorSchema);
