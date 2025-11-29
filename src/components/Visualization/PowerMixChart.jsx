import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export function PowerMixChart({ logs }) {
    const recentLogs = logs.slice(-20);
    const labels = recentLogs.map(l => `S${l.step}`);

    // Mock power breakdown based on log data
    // Static is constant-ish, Dynamic varies, Penalty only on miss
    const staticData = recentLogs.map(() => 50); // 50 pJ base
    const dynamicData = recentLogs.map(l => l.isHit ? 100 : 20); // More dynamic on hit? Or just access cost
    const penaltyData = recentLogs.map(l => l.isHit ? 0 : 200); // High penalty on miss

    // We want cumulative for "Power Mix" usually, or per access? 
    // The screenshot shows increasing lines, so it's cumulative energy or average power over time.
    // Let's do cumulative energy for the "Stacked" look.

    let cumStatic = 0;
    let cumDynamic = 0;
    let cumPenalty = 0;

    const sData = [];
    const dData = [];
    const pData = [];

    recentLogs.forEach(l => {
        cumStatic += 50;
        cumDynamic += (l.isHit ? 100 : 20);
        cumPenalty += (l.isHit ? 0 : 200);
        sData.push(cumStatic);
        dData.push(cumDynamic);
        pData.push(cumPenalty);
    });

    const data = {
        labels,
        datasets: [
            {
                label: 'Static Power',
                data: sData,
                borderColor: '#3b82f6', // Blue
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            },
            {
                label: 'Dynamic Power',
                data: dData,
                borderColor: '#fbbf24', // Yellow
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            },
            {
                label: 'Miss Penalty',
                data: pData,
                borderColor: '#ef4444', // Red
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#b2bec3' }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#636e72' }
            },
            y: {
                stacked: true,
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#636e72' },
                title: { display: true, text: 'Energy (pJ)', color: '#b2bec3' }
            }
        }
    };

    return <Line data={data} options={options} />;
}
