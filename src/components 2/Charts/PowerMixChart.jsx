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

export function PowerMixChart({ sim }) {
    const { powerHistory, history } = sim;

    // Use history labels if available, otherwise generate indices
    const labels = history && history.labels ? history.labels : (powerHistory.static || []).map((_, i) => i);

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Static Power',
                data: powerHistory.static || [],
                borderColor: '#5dade2',
                backgroundColor: 'rgba(93, 173, 226, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            },
            {
                label: 'Dynamic Power',
                data: powerHistory.dynamic || [],
                borderColor: '#fdcb6e',
                backgroundColor: 'rgba(253, 203, 110, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            },
            {
                label: 'Miss Penalty',
                data: powerHistory.penalty || [],
                borderColor: '#e17055',
                backgroundColor: 'rgba(225, 112, 85, 0.2)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            },
        ],
    };

    const computedStyle = getComputedStyle(document.body);
    const gridColor = computedStyle.getPropertyValue('--glass-border').trim();
    const textColor = computedStyle.getPropertyValue('--text-secondary').trim();

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: textColor,
                    font: { family: "'Space Grotesk', sans-serif", size: 11 },
                    usePointStyle: true,
                    boxWidth: 8
                }
            },
            title: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 24, 38, 0.9)',
                titleColor: '#fff',
                bodyColor: '#b7c0cf',
                borderColor: 'rgba(48, 112, 179, 0.3)',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(2) + ' pJ';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                stacked: true,
                beginAtZero: true,
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: "'Fira Code', monospace", size: 10 } },
                border: { display: false },
                title: {
                    display: true,
                    text: 'Power (pJ)',
                    color: textColor,
                    font: { size: 10 }
                }
            },
            x: {
                grid: { display: false },
                ticks: { display: false },
                border: { display: false }
            }
        },
        elements: {
            line: { tension: 0.4 }
        }
    };

    return (
        <div className="w-full h-full min-h-[250px]">
            <Line data={data} options={options} />
        </div>
    );
}
