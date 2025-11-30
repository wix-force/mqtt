import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Title,
    Tooltip,
    Legend,
    CategoryScale
} from "chart.js";
import "chartjs-adapter-date-fns";

Chart.register(
    LineController, LineElement, PointElement,
    LinearScale, TimeScale, Title, Tooltip, Legend, CategoryScale
);

export default function App() {
    const [dataPoints, setDataPoints] = useState([]); // {ts, temperature, humidity}
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // adjust backend URL if needed
    const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    useEffect(() => {
        // 1) fetch last 50 points
        fetch(`${BACKEND}/api/latest/50`)
            .then(res => res.json())
            .then(arr => {
                const formatted = arr.map(d => ({
                    ts: new Date(d.ts || d.receivedAt),
                    temperature: d.temperature,
                    humidity: d.humidity
                }));
                setDataPoints(formatted);
                initChart(formatted);
            })
            .catch(err => {
                console.error("Fetch history error:", err);
                initChart([]);
            });

        // 2) socket.io connect
        const socket = io(BACKEND);

        socket.on("connect", () => console.log("Socket connected:", socket.id));
        socket.on("sensor-data", (msg) => {
            const point = {
                ts: new Date(msg.ts || msg.receivedAt),
                temperature: msg.temperature,
                humidity: msg.humidity
            };

            // append and keep max 200 points
            setDataPoints(prev => {
                const next = [...prev, point].slice(-200);
                // update chart
                updateChart(next);
                return next;
            });
        });

        socket.on("disconnect", () => console.log("Socket disconnected"));
        return () => socket.disconnect();
        // eslint-disable-next-line
    }, []);

    function initChart(points) {
        const ctx = chartRef.current.getContext("2d");
        const labels = points.map(p => p.ts);
        const tempData = points.map(p => p.temperature);
        const humData = points.map(p => p.humidity);

        chartInstanceRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    { label: "Temperature (°C)", data: tempData, tension: 0.2, yAxisID: "y" },
                    { label: "Humidity (%)", data: humData, tension: 0.2, yAxisID: "y1" }
                ]
            },
            options: {
                animation: false,
                responsive: true,
                scales: {
                    x: { type: "time", time: { unit: "second", tooltipFormat: "PPpp" } },
                    y: { position: "left", title: { display: true, text: "°C" } },
                    y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "%" } }
                }
            }
        });
    }

    function updateChart(points) {
        const chart = chartInstanceRef.current;
        if (!chart) return;
        chart.data.labels = points.map(p => p.ts);
        chart.data.datasets[0].data = points.map(p => p.temperature);
        chart.data.datasets[1].data = points.map(p => p.humidity);
        chart.update("none"); // no animation
    }

    return (
        <div className="container">
            <div className="header">
                <div>
                    <h2>MQTT Realtime Dashboard</h2>
                    <small>Live sensor feed (publisher → broker → backend → this dashboard)</small>
                </div>
                <div><small>Backend: {BACKEND}</small></div>
            </div>

            <div className="card">
                <canvas ref={chartRef} height="200" />
            </div>

            <div style={{ marginTop: 12 }} className="card">
                <h4>Last readings (most recent at bottom)</h4>
                <div style={{ maxHeight: 220, overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left" }}>Time</th>
                                <th style={{ textAlign: "left" }}>Temperature</th>
                                <th style={{ textAlign: "left" }}>Humidity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dataPoints.slice(-50).map((p, i) => (
                                <tr key={i}>
                                    <td style={{ padding: "6px 8px" }}>{p.ts.toLocaleString()}</td>
                                    <td style={{ padding: "6px 8px" }}>{p.temperature}</td>
                                    <td style={{ padding: "6px 8px" }}>{p.humidity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
