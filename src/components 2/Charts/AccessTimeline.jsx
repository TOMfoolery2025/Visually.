import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
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

export function AccessTimeline({ sim }) {
    const { history } = sim;

    const data = {
        labels: history?.labels || [],
        datasets: [
            {
                type: 'line',
                label: 'Hit Rate %',
                data: history?.hitRate || [],
                borderColor: '#00b894',
                backgroundColor: 'rgba(0, 184, 148, 0.18)',
                fill: true,
                tension: 0.35,
                yAxisID: 'y',
            },
            {
                type: 'bar',
                label: 'Energy (pJ)',
                data: history?.energy || [],
                backgroundColor: 'rgba(48, 112, 179, 0.35)',
                borderRadius: 4,
                yAxisID: 'y1',
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
                position: 'top',
                labels: {
                    color: textColor,
                    font: { family: "'Space Grotesk', sans-serif", size: 12 }
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
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(2);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                min: 0,
                max: 100,
                grid: { color: gridColor },
                ticks: { color: textColor, font: { family: "'Fira Code', monospace", size: 10 } },
                border: { display: false }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: textColor, font: { family: "'Fira Code', monospace", size: 10 } },
                border: { display: false }
            },
            x: {
                grid: { display: false },
                ticks: { display: false }, // Hide x-axis labels for cleaner look
                border: { display: false }
            }
        },
        elements: {
            line: {
                borderWidth: 2,
                tension: 0.4 // Smooth curves
            },
            point: {
                radius: 0, // Hide points for cleaner line
                hitRadius: 10,
                hoverRadius: 4
            }
        }
    };

    return (
        <div className="w-full h-full min-h-[350px]">
            <Chart type='bar' data={data} options={options} />
        </div>
    );
}
