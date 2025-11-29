import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { InfoTooltip } from '../Common/InfoTooltip';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
} from 'chart.js';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip
);

export function StatsCard({ title, value, sub, tooltip, variant, data }) {

    const renderMiniChart = () => {
        if (!variant || !data) return null;

        if (variant === 'donut') {
            const chartData = {
                labels: ['Hits', 'Misses'],
                datasets: [{
                    data: [data.hits, data.misses],
                    backgroundColor: ['#00b894', '#d63031'],
                    borderWidth: 0,
                    cutout: '75%',
                }]
            };
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { duration: 0 }
            };
            return (
                <div className="w-16 h-16 relative">
                    <Doughnut data={chartData} options={options} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-white/10"></div>
                    </div>
                </div>
            );
        }

        if (variant === 'sparkline') {
            // Performance sparkline
            const chartData = {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    borderColor: '#a29bfe',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    backgroundColor: 'rgba(162, 155, 254, 0.1)',
                    tension: 0.4
                }]
            };
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false, min: 0 } },
                animation: { duration: 0 }
            };
            return (
                <div className="w-full h-10 mt-2">
                    <Line data={chartData} options={options} />
                </div>
            );
        }

        if (variant === 'bar') {
            // Energy/Access bar
            const chartData = {
                labels: data.labels || ['A', 'B', 'C'],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: data.colors || ['#5dade2', '#fdcb6e', '#e17055'],
                    borderRadius: 2,
                    barThickness: 6
                }]
            };
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
                animation: { duration: 0 }
            };
            return (
                <div className="w-full h-10 mt-2">
                    <Bar data={chartData} options={options} />
                </div>
            );
        }
    };

    return (
        <div className="glass-panel p-4 flex flex-col justify-between min-h-[140px] hover:border-[color:var(--accent-color)] transition-colors">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{title}</span>
                {tooltip && (
                    <InfoTooltip content={tooltip} formula={tooltip.includes('=') ? tooltip : null} />
                )}
            </div>

            <div className="flex-1 flex flex-col justify-end">
                <div className="flex justify-between items-end mb-2">
                    <div className="text-3xl font-bold text-[color:var(--text-primary)] tracking-tight font-mono">{value}</div>
                    {variant === 'donut' && renderMiniChart()}
                </div>

                {sub && <div className="text-xs text-[color:var(--text-muted)]">{sub}</div>}

                {variant !== 'donut' && renderMiniChart()}
            </div>
        </div>
    );
}
