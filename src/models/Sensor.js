// models/Sensor.js
import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  ts: Date,
});

export default mongoose.model("SensorData", sensorSchema);
