import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

import { Info } from 'lucide-react';
import { useTooltip } from '../../context/TooltipContext';

export function DashboardGrid({ stats, powerStats }) {
    const { showTooltip } = useTooltip();
    // Derived Metrics
    const hitRate = stats.accesses > 0 ? ((stats.hits / stats.accesses) * 100).toFixed(1) : '0.0';
    const avgPower = stats.accesses > 0 ? (powerStats.totalEnergy / stats.accesses).toFixed(2) : 0;
    const amat = 1 + (stats.accesses > 0 ? (stats.misses / stats.accesses) * 100 : 0); // Simplified AMAT

    // 1. Hit Rate Doughnut
    const hitRateData = {
        labels: ['Hit', 'Miss'],
        datasets: [{
            data: [stats.hits, stats.misses],
            backgroundColor: ['#22c55e', '#ef4444'], // Green, Red
            borderWidth: 0,
            cutout: '75%',
        }]
    };

    const energyData = {
        labels: ['Static', 'Dynamic', 'Penalty'],
        datasets: [{
            data: [powerStats.staticEnergy, powerStats.dynamicEnergy, powerStats.missPenaltyEnergy],
            backgroundColor: ['#3b82f6', '#fbbf24', '#ef4444'], // Blue, Yellow, Red
            borderRadius: 4,
            barThickness: 8,
        }]
    };

    const accessData = {
        labels: ['Reads', 'Writes'],
        datasets: [{
            data: [stats.reads, stats.writes],
            backgroundColor: ['#06b6d4', '#f59e0b'], // Cyan, Orange
            borderRadius: 4,
            barThickness: 8,
        }]
    };

    const optionsMini = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
    };

    const showHitRateInfo = () => {
        showTooltip("Hit Rate Formula", (
            <div>
                <p className="tooltip-formula">Hit Rate = (Hits / Total Accesses) × 100%</p>
                <p>Percentage of memory accesses found in the cache.</p>
                <p><strong>Current:</strong> ({stats.hits} / {stats.accesses}) × 100% = {hitRate}%</p>
            </div>
        ));
    };

    const showEnergyInfo = () => {
        showTooltip("Energy Formula", (
            <div>
                <p className="tooltip-formula">Total Energy = Static + Dynamic + Penalty</p>
                <p><strong>Static:</strong> Leakage power over time.</p>
                <p><strong>Dynamic:</strong> Energy from reading/writing blocks.</p>
                <p><strong>Penalty:</strong> Energy cost of fetching from lower levels.</p>
            </div>
        ));
    };

    const showAMATInfo = () => {
        showTooltip("AMAT Formula", (
            <div>
                <p className="tooltip-formula">AMAT = Hit Time + (Miss Rate × Miss Penalty)</p>
                <p><strong>Average Memory Access Time</strong> in cycles.</p>
                <p>Lower is better.</p>
            </div>
        ));
    };

    return (
        <div className="dashboard-grid">
            {/* Card 1: Hit Rate */}
            <div className="metric-card graylog-card">
                <div className="card-header">
                    <span className="card-label">Hit Rate</span>
                    <div className="tooltip-trigger" onClick={showHitRateInfo}>
                        <Info size={14} />
                    </div>
                </div>
                <div className="card-body">
                    <div className="big-number" id="hitRateValue">{hitRate}%</div>
                    <div className="chart-mini-container">
                        <Doughnut data={hitRateData} options={optionsMini} />
                    </div>
                </div>
            </div>

            {/* Card 3: Total Energy */}
            <div className="metric-card graylog-card">
                <div className="card-header">
                    <span className="card-label">Total Energy</span>
                    <div className="tooltip-trigger" onClick={showEnergyInfo}>
                        <Info size={14} />
                    </div>
                </div>
                <div className="card-body">
                    <div className="big-number" id="energyValue">{powerStats.totalEnergy.toFixed(0)} pJ</div>
                    <div className="sub-text">Avg Energy/Access: <span id="avgPowerValue">{avgPower} pJ</span></div>
                    <div className="chart-mini-container">
                        <Bar data={energyData} options={optionsMini} />
                    </div>
                </div>
            </div>

            {/* Card 4: Performance (AMAT) */}
            <div className="metric-card graylog-card">
                <div className="card-header">
                    <span className="card-label">Performance (AMAT)</span>
                    <div className="tooltip-trigger" onClick={showAMATInfo}>
                        <Info size={14} />
                    </div>
                </div>
                <div className="card-body">
                    <div className="big-number" id="amatValue">{amat.toFixed(1)} cycles</div>
                    <div className="sub-text">Lower is better</div>
                    <div className="chart-mini-container">
                        {/* Placeholder for AMAT history if needed */}
                    </div>
                </div>
            </div>

            {/* Card 5: Accesses */}
            <div className="metric-card graylog-card">
                <div className="card-header">
                    <span className="card-label">Accesses</span>
                </div>
                <div className="card-body">
                    <div className="big-number" id="accessesValue">{stats.accesses}</div>
                    <div className="stats-row">
                        <span className="stat-item green" id="hitsValue">{stats.hits} Hits</span>
                        <span className="stat-item red" id="missesValue">{stats.misses} Misses</span>
                    </div>
                    <div className="sub-text subtle">L2 assists: <span id="l2HitsValue">0</span> / L2 misses: <span id="l2MissesValue">0</span></div>
                    <div className="chart-mini-container">
                        <Bar data={accessData} options={optionsMini} />
                    </div>
                </div>
            </div>
        </div>
    );
}
