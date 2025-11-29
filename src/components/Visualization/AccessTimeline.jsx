import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export function AccessTimeline({ logs }) {
    const recentLogs = logs.filter(l => l.accessType !== 'ALU').slice(-20);
    const labels = recentLogs.map(l => `S${l.step}`);

    // Calculate cumulative hit rate for the line
    let hits = 0;
    const hitRateData = recentLogs.map((l, i) => {
        if (l.isHit) hits++;
        return (hits / (i + 1)) * 100; // Simple local average for viz, or use global if passed
    });

    const energyData = recentLogs.map(l => l.energy);

    const data = {
        labels,
        datasets: [
            {
                type: 'line',
                label: 'Hit Rate %',
                data: hitRateData,
                borderColor: '#22c55e', // Green line
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                yAxisID: 'y',
                tension: 0.4,
                pointRadius: 0,
                fill: true
            },
            {
                type: 'bar',
                label: 'Energy (pJ)',
                data: energyData,
                backgroundColor: '#1e3a8a', // Dark Blue bars
                yAxisID: 'y1',
                barThickness: 4,
                borderRadius: 2
            }
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#b2bec3' }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#636e72' }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                min: 0,
                max: 100,
                grid: { display: false },
                ticks: { color: '#22c55e' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#1e3a8a' }
            }
        }
    };

    return <Chart type='bar' data={data} options={options} />;
}
