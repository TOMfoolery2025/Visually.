import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfigPanel } from '../Dashboard/ConfigPanel';
import { DashboardGrid } from '../Dashboard/DashboardGrid';
import { useSimulatorContext } from '../../context/SimulatorContext';
import { SignalWaveforms } from '../Visualization/SignalWaveforms';
import { AccessTimeline } from '../Visualization/AccessTimeline';
import { PowerMixChart } from '../Visualization/PowerMixChart';

import { VisualGrid } from '../Visualization/VisualGrid';
import { DataFlowDiagram } from '../Visualization/DataFlowDiagram';

export function L1Page({ level = 'L1' }) {
    const navigate = useNavigate();
    const {
        sim, stats, l2Stats, powerStats, logs,
        cacheState, l2CacheState,
        step, reset, configure,
        historyLength, viewStep, jumpToStep, play, pause, isPlaying, stepIndex,
        addressSequence, setAddressSequence
    } = useSimulatorContext();

    // Select data based on level
    const currentCacheState = level === 'L1' ? cacheState : l2CacheState;
    const currentStats = level === 'L1' ? stats : l2Stats;

    // Helper to calculate hit rate safely
    const hitRate = currentStats.accesses > 0
        ? ((currentStats.hits / currentStats.accesses) * 100).toFixed(1)
        : '0.0';

    const [activeTab, setActiveTab] = React.useState('grid');
    const [zoom, setZoom] = useState(1);

    return (
        <section className="view active">
            {/* ... header ... */}
            <div className="view-header">
                <button className="btn-back" onClick={() => navigate('/')}>← Back to System</button>
                <h2>{level} Cache Detail</h2>
            </div>

            <div className="main-grid">
                {/* ... ConfigPanel and DashboardGrid ... */}
                <ConfigPanel
                    onStep={step}
                    onReset={reset}
                    onConfigure={configure}
                    sim={sim}
                    historyLength={historyLength}
                    viewStep={viewStep}
                    onJumpToStep={jumpToStep}
                    onPlay={play}
                    onPause={pause}
                    isPlaying={isPlaying}
                    stepIndex={stepIndex}
                    addressSequence={addressSequence}
                    setAddressSequence={setAddressSequence}
                />

                <DashboardGrid stats={currentStats} powerStats={powerStats} />

                {/* ... Waveforms and Insights ... */}
                <div className="waveform-row">
                    <div className="metric-card graylog-card full-width">
                        <div className="card-header">
                            <span className="card-label">Signal Waveforms</span>
                        </div>
                        <div className="card-body" style={{ height: '150px' }}>
                            <SignalWaveforms logs={logs} />
                        </div>
                    </div>
                </div>

                <div className="insight-grid">
                    <div className="metric-card graylog-card tall">
                        <div className="card-header">
                            <span className="card-label">Access Timeline</span>
                            <span className="pill live-pill">live</span>
                        </div>
                        <div className="card-body" style={{ height: '300px' }}>
                            <AccessTimeline logs={logs} />
                        </div>
                    </div>
                    <div className="metric-card graylog-card tall">
                        <div className="card-header">
                            <span className="card-label">Power Mix</span>
                            <div className="pill subtle">Stacked</div>
                        </div>
                        <div className="card-body" style={{ height: '300px' }}>
                            <PowerMixChart logs={logs} />
                        </div>
                    </div>
                </div>

                {/* Main Visualization Tabs */}
                <div className="viz-container glass-panel">
                    <div className="panel-header">
                        <h2>{level} Cache State Visualization</h2>
                        <div className="tabs">
                            <div className="zoom-control">
                                <label htmlFor="gridZoom" title="Zoom Grid">🔍</label>
                                <input
                                    type="range"
                                    id="gridZoom"
                                    min="0.5"
                                    max="1.5"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '30px' }}>{Math.round(zoom * 100)}%</span>
                            </div>
                            <button className={`tab-btn ${activeTab === 'grid' ? 'active' : ''}`} onClick={() => setActiveTab('grid')}>Visual Grid</button>
                            <button className={`tab-btn ${activeTab === 'power' ? 'active' : ''}`} onClick={() => setActiveTab('power')}>Power Chart</button>
                            <button className={`tab-btn ${activeTab === 'misses' ? 'active' : ''}`} onClick={() => setActiveTab('misses')}>Miss Types</button>
                            <button className={`tab-btn ${activeTab === 'movement' ? 'active' : ''}`} onClick={() => setActiveTab('movement')}>Data Flow</button>
                        </div>
                    </div>
                    <div className="viz-content" style={{ overflow: 'auto', height: '100%', '--zoom-scale': zoom }}>
                        {activeTab === 'grid' && (
                            <div id="visualGrid" className="cache-grid-container">
                                <VisualGrid cacheState={currentCacheState} />
                            </div>
                        )}
                        {activeTab === 'power' && (
                            <div className="chart-wrapper" style={{ height: '300px', width: '100%' }}>
                                <PowerMixChart logs={logs} />
                            </div>
                        )}
                        {activeTab === 'misses' && (
                            <div className="chart-wrapper" style={{ height: '300px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center', color: '#a0a0a0' }}>
                                    <h3>Miss Type Breakdown</h3>
                                    <p>Compulsory: {currentStats.compulsoryMisses || 0}</p>
                                    <p>Capacity: {currentStats.capacityMisses || 0}</p>
                                    <p>Conflict: {currentStats.conflictMisses || 0}</p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'movement' && (
                            <div id="dataMovement" className="data-movement" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <DataFlowDiagram log={logs[logs.length - 1]} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Logs */}
                <div className="logs-container glass-panel">
                    <div className="panel-header">
                        <h2>Access Log</h2>
                    </div>
                    <div className="table-responsive">
                        <table id="resultsTable">
                            <thead>
                                <tr>
                                    <th>Step</th>
                                    <th>Address</th>
                                    <th>Result</th>
                                    <th>Location</th>
                                    <th>Tag</th>
                                    <th>Energy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => {
                                    const isALU = log.accessType === 'ALU';
                                    return (
                                        <tr key={i}>
                                            <td>{log.step}</td>
                                            <td>{isALU ? '---' : `0x${log.address.toString(16).toUpperCase()}`}</td>
                                            <td className={isALU ? 'text-secondary' : (log.isHit ? 'success-text' : 'danger-text')}>
                                                {isALU ? 'ALU' : (log.isHit ? 'HIT' : 'MISS')}
                                            </td>
                                            <td>{isALU ? '---' : `Set ${log.setIndex}, Way ${log.wayIndex}`}</td>
                                            <td>{isALU ? '---' : `0x${log.tag.toString(16).toUpperCase()}`}</td>
                                            <td>{log.energy.toFixed(2)} pJ</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
