import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export function SignalWaveforms({ logs }) {
    // Generate waveform data from logs
    // We want to show the last N steps (e.g., 20)
    // Show all logs for "compact" view, or a larger window
    const recentLogs = logs; // Show all history
    const labels = recentLogs.map(l => `S${l.step}`);

    // Signals:
    // CLK: Toggle every step (0, 1, 0, 1...)
    // HIT: 1 if hit, 0 if miss
    // MISS: 1 if miss, 0 if hit
    // WE: 1 if write, 0 if read (assuming isWrite property exists, else random/mock for now)

    const clkData = recentLogs.map((_, i) => i % 2);
    const hitData = recentLogs.map(l => l.isHit ? 1 : 0);
    const missData = recentLogs.map(l => l.isHit ? 0 : 1);
    const weData = recentLogs.map(l => l.isWrite ? 1 : 0); // Assuming isWrite is in log, if not default 0

    const data = {
        labels,
        datasets: [
            {
                label: 'CLK',
                data: clkData,
                borderColor: '#06b6d4', // Cyan
                borderWidth: 2,
                stepped: true,
                pointRadius: 0,
                yAxisID: 'y_clk',
            },
            {
                label: 'HIT',
                data: hitData,
                borderColor: '#22c55e', // Green
                borderWidth: 2,
                stepped: true,
                pointRadius: 0,
                yAxisID: 'y_hit',
            },
            {
                label: 'MISS',
                data: missData,
                borderColor: '#ef4444', // Red
                borderWidth: 2,
                stepped: true,
                pointRadius: 0,
                yAxisID: 'y_miss',
            },
            {
                label: 'WE',
                data: weData,
                borderColor: '#f59e0b', // Orange
                borderWidth: 2,
                stepped: true,
                pointRadius: 0,
                yAxisID: 'y_we',
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: true,
                labels: { color: '#b2bec3', font: { family: 'JetBrains Mono' } }
            },
            tooltip: { enabled: true }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#636e72' }
            },
            // Stack Y axes to separate signals vertically
            y_clk: { type: 'linear', display: false, min: 0, max: 1.5, stack: 'stack', stackWeight: 1 },
            y_hit: { type: 'linear', display: false, min: 0, max: 1.5, stack: 'stack', stackWeight: 1 },
            y_miss: { type: 'linear', display: false, min: 0, max: 1.5, stack: 'stack', stackWeight: 1 },
            y_we: { type: 'linear', display: false, min: 0, max: 1.5, stack: 'stack', stackWeight: 1 },
        }
    };

    return <Line data={data} options={options} />;
}
