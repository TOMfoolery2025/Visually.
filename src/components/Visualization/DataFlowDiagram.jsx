import React, { useEffect, useState } from 'react';
import { Cpu, Zap, Layers, Database } from 'lucide-react';

export function DataFlowDiagram({ log }) {
    const [progress, setProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Auto-play effect
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        setIsPlaying(false);
                        return 100;
                    }
                    return p + 1;
                });
            }, 20); // 2 seconds for full traversal
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Reset on new log
    useEffect(() => {
        setProgress(0);
        setIsPlaying(true);
    }, [log]);

    // Determine path and max depth
    const getTarget = () => {
        if (!log) return 'cpu';
        if (log.accessType === 'ALU') return 'cpu';
        if (log.isHit) return 'l1';
        if (log.l2Hit) return 'l2';
        return 'ram';
    };

    const target = getTarget();

    // Calculate positions based on progress
    // Nodes are at: CPU: 10%, L1: 35%, L2: 60%, RAM: 85% (approx)
    const positions = { cpu: 10, l1: 36, l2: 62, ram: 88 };

    // Speed up animation to 1s to keep up with "Play" mode
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        setIsPlaying(false);
                        return 100;
                    }
                    return p + 2; // 2% per 20ms = 100% in 1s
                });
            }, 20);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const getPacketPos = () => {
        const targetPos = positions[target];
        const startPos = positions.cpu;

        if (progress <= 50) {
            // Request Phase: CPU -> Target
            const phaseProgress = progress / 50; // 0 to 1
            return startPos + (targetPos - startPos) * phaseProgress;
        } else {
            // Response Phase: Target -> CPU
            const phaseProgress = (progress - 50) / 50; // 0 to 1
            return targetPos - (targetPos - startPos) * phaseProgress;
        }
    };

    const currentPos = getPacketPos();
    const isRequest = progress <= 50;
    const packetValue = isRequest ? (log ? `0x${log.address.toString(16).toUpperCase()}` : '---') : (log ? log.data : '---');
    const packetColor = isRequest ? '#3498db' : '#2ecc71';

    // Status Badges
    const l1Status = log ? (log.isHit ? 'HIT' : 'MISS') : '';
    const l2Status = log && !log.isHit ? (log.l2Hit ? 'HIT' : 'MISS') : '';

    return (
        <div className="data-flow-diagram" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
        }}>
            <style>{`
                .df-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    position: relative;
                    padding: 0 40px;
                    margin-bottom: 40px;
                }
                .df-node {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 80px;
                    height: 80px;
                    background: var(--glass-bg);
                    border: 2px solid var(--glass-border);
                    border-radius: 12px;
                    z-index: 2;
                    transition: all 0.3s ease;
                    position: relative;
                }
                .df-node.active {
                    transform: scale(1.1);
                    box-shadow: 0 0 20px currentColor;
                }
                .df-badge {
                    position: absolute;
                    top: -12px;
                    right: -12px;
                    padding: 2px 6px;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: bold;
                    color: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 5;
                }
                .df-badge.hit { background: #2ecc71; }
                .df-badge.miss { background: #e74c3c; }
                
                .df-line-bg {
                    position: absolute;
                    top: 40px;
                    left: 80px;
                    right: 80px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    z-index: 1;
                }
                .df-packet-visual {
                    position: absolute;
                    top: 20px;
                    transform: translateX(-50%);
                    background: var(--packet-color);
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: white;
                    white-space: nowrap;
                    box-shadow: 0 0 10px var(--packet-color);
                    z-index: 10;
                    transition: left 0.02s linear; /* Smoother update */
                    border: 2px solid white;
                }
                .df-packet-arrow {
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0; 
                    height: 0; 
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid white;
                }
                .df-controls {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    width: 80%;
                    background: rgba(0,0,0,0.3);
                    padding: 10px 20px;
                    border-radius: 20px;
                }
                .df-slider {
                    flex: 1;
                    cursor: pointer;
                }
                .df-play-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 1.2rem;
                }
                /* Node Colors */
                .df-node.cpu { border-color: #e17055; color: #e17055; }
                .df-node.l1 { border-color: #0984e3; color: #0984e3; }
                .df-node.l2 { border-color: #6c5ce7; color: #6c5ce7; }
                .df-node.ram { border-color: #00b894; color: #00b894; }
            `}</style>

            <div className="df-container">
                <div className="df-line-bg"></div>

                {/* Packet */}
                <div
                    className="df-packet-visual"
                    style={{
                        left: `${currentPos}%`,
                        '--packet-color': packetColor
                    }}
                >
                    {packetValue}
                    <div className="df-packet-arrow"></div>
                </div>

                <div className={`df-node cpu ${target === 'cpu' && progress === 100 ? 'active' : ''}`}>
                    <Cpu size={32} />
                    <div className="df-label">CPU</div>
                </div>

                <div className={`df-node l1 ${target === 'l1' && progress === 50 ? 'active' : ''}`}>
                    <Zap size={32} />
                    <div className="df-label">L1</div>
                    {l1Status && <div className={`df-badge ${l1Status.toLowerCase()}`}>{l1Status}</div>}
                </div>

                <div className={`df-node l2 ${target === 'l2' && progress === 50 ? 'active' : ''}`}>
                    <Layers size={32} />
                    <div className="df-label">L2</div>
                    {l2Status && <div className={`df-badge ${l2Status.toLowerCase()}`}>{l2Status}</div>}
                </div>

                <div className={`df-node ram ${target === 'ram' && progress === 50 ? 'active' : ''}`}>
                    <Database size={32} />
                    <div className="df-label">RAM</div>
                </div>
            </div>

            <div className="df-controls">
                <button
                    className="df-play-btn"
                    onClick={() => {
                        setProgress(0);
                        setIsPlaying(true);
                    }}
                    title="Replay Animation"
                >
                    ↺
                </button>
                <button className="df-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? '⏸' : '▶'}
                </button>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => {
                        setIsPlaying(false);
                        setProgress(Number(e.target.value));
                    }}
                    className="df-slider"
                />
                <span style={{ minWidth: '40px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {progress}%
                </span>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#a0a0a0', display: 'flex', gap: '20px' }}>
                <span>Request: {log?.address ? '0x' + log.address.toString(16).toUpperCase() : '---'}</span>
                <span>•</span>
                <span>L1: <strong style={{ color: l1Status === 'HIT' ? '#2ecc71' : (l1Status === 'MISS' ? '#e74c3c' : 'inherit') }}>{l1Status || '-'}</strong></span>
                <span>•</span>
                <span>L2: <strong style={{ color: l2Status === 'HIT' ? '#2ecc71' : (l2Status === 'MISS' ? '#e74c3c' : 'inherit') }}>{l2Status || '-'}</strong></span>
            </div>
        </div>
    );
}
