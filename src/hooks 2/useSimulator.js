import { useState, useEffect, useRef, useCallback } from 'react';
import { CacheSimulator } from '../lib/simulator';

export function useSimulator() {
    // Config State
    const [config, setConfig] = useState({
        cacheSize: 1024,
        blockSize: 32,
        associativity: 4,
        replacementPolicy: 'LRU',
        powerParams: { staticPower: 10, missPenaltyPower: 50 },
        voltage: 1.0
    });

    // Simulation State
    const [sim, setSim] = useState(null);
    const [stats, setStats] = useState({ hits: 0, misses: 0, accesses: 0 });
    const [powerStats, setPowerStats] = useState({ total: 0, static: 0, dynamic: 0, penalty: 0 });
    const [cacheState, setCacheState] = useState([]); // Grid data
    const [lastResult, setLastResult] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [trace, setTrace] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1000);

    const simRef = useRef(null);
    const timerRef = useRef(null);

    // Initialize Simulator
    useEffect(() => {
        const newSim = new CacheSimulator(
            config.cacheSize,
            config.blockSize,
            config.associativity,
            config.replacementPolicy,
            config.powerParams,
            config.voltage
        );
        simRef.current = newSim;
        setSim(newSim);
        syncState();
    }, [config]);

    const [history, setHistory] = useState({
        labels: [],
        hitRate: [],
        energy: []
    });

    const [powerHistory, setPowerHistory] = useState({
        static: [],
        dynamic: [],
        penalty: []
    });

    const [accessLog, setAccessLog] = useState([]);

    const syncState = useCallback(() => {
        if (!simRef.current) return;
        setStats({ ...simRef.current.stats });
        setPowerStats({ ...simRef.current.powerStats });
        setCacheState(JSON.parse(JSON.stringify(simRef.current.cache)));
        setLastResult(simRef.current.lastResult ? { ...simRef.current.lastResult } : null);

        // Update History
        const currentStats = simRef.current.stats;
        const currentPower = simRef.current.powerStats;
        const hitRate = currentStats.accesses > 0 ? (currentStats.hits / currentStats.accesses) * 100 : 0;

        setHistory(prev => {
            const newLabels = [...prev.labels, simRef.current.currentTime];
            const newHitRate = [...prev.hitRate, hitRate];
            const newEnergy = [...prev.energy, simRef.current.lastAccessEnergy || 0];

            // Keep last 50 points
            if (newLabels.length > 50) {
                return {
                    labels: newLabels.slice(-50),
                    hitRate: newHitRate.slice(-50),
                    energy: newEnergy.slice(-50)
                };
            }
            return { labels: newLabels, hitRate: newHitRate, energy: newEnergy };
        });

        // Update Power History (Stacked)
        setPowerHistory(prev => {
            const newStatic = [...prev.static, currentPower.static];
            const newDynamic = [...prev.dynamic, currentPower.dynamic];
            const newPenalty = [...prev.penalty, currentPower.penalty];

            if (newStatic.length > 50) {
                return {
                    static: newStatic.slice(-50),
                    dynamic: newDynamic.slice(-50),
                    penalty: newPenalty.slice(-50)
                };
            }
            return { static: newStatic, dynamic: newDynamic, penalty: newPenalty };
        });

        // Update Log
        if (simRef.current.lastResult) {
            setAccessLog(prev => [
                {
                    step: simRef.current.currentTime,
                    address: simRef.current.lastResult.address,
                    isHit: simRef.current.lastResult.isHit,
                    tag: simRef.current.lastResult.tag,
                    energy: simRef.current.lastResult.energy
                },
                ...prev
            ].slice(0, 100)); // Keep last 100
        }
    }, []);

    const loadTrace = (traceString) => {
        const lines = traceString.split('\n').map(l => l.trim()).filter(l => l);
        setTrace(lines);
        setStepIndex(0);
        setHistory({ labels: [], hitRate: [], energy: [] }); // Reset history
        setPowerHistory({ static: [], dynamic: [], penalty: [] }); // Reset power history
        if (simRef.current) {
            simRef.current.reset();
            syncState();
        }
    };

    const step = useCallback(() => {
        if (!simRef.current || stepIndex >= trace.length) {
            setIsPlaying(false);
            return;
        }

        const line = trace[stepIndex];
        // Parse "Write 0x100 5" or just "0x100" (Read)
        // Simple parsing logic matching legacy
        let type = 'Read';
        let addr = line;
        let val = null;

        if (line.includes('=')) {
            // x = 10
            type = 'Write';
            const parts = line.split('=').map(s => s.trim());
            addr = parts[0];
            val = parts[1];
        } else if (line.toLowerCase().startsWith('write')) {
            // Write 0x100 5
            type = 'Write';
            const parts = line.split(/\s+/);
            addr = parts[1];
            val = parts[2] || 0;
        }

        simRef.current.access(addr, type, val);
        setStepIndex(prev => prev + 1);
        syncState();
    }, [stepIndex, trace, syncState]);

    const reset = () => {
        if (simRef.current) {
            simRef.current.reset();
            setStepIndex(0);
            setIsPlaying(false);
            setHistory({ labels: [], hitRate: [], energy: [] });
            setPowerHistory({ static: [], dynamic: [], penalty: [] });
            setAccessLog([]);
            syncState();
        }
    };

    const seekTo = useCallback((targetStep) => {
        if (!simRef.current || targetStep < 0 || targetStep > trace.length) return;

        // If target is before current, we must reset and replay
        if (targetStep < stepIndex) {
            simRef.current.reset();
            setHistory({ labels: [], hitRate: [], energy: [] });
            setPowerHistory({ static: [], dynamic: [], penalty: [] });
            setAccessLog([]);
            // Replay loop
            for (let i = 0; i < targetStep; i++) {
                const line = trace[i];
                let type = 'Read';
                let addr = line;
                let val = null;
                if (line.includes('=')) {
                    type = 'Write';
                    const parts = line.split('=').map(s => s.trim());
                    addr = parts[0];
                    val = parts[1];
                } else if (line.toLowerCase().startsWith('write')) {
                    type = 'Write';
                    const parts = line.split(/\s+/);
                    addr = parts[1];
                    val = parts[2] || 0;
                }
                simRef.current.access(addr, type, val);

                // We need to update history for charts to look correct at this point
                // This is expensive for long traces, but necessary for "Time Travel"
                // Optimization: Only update history every N steps or just at the end?
                // For accurate charts, we need to capture history.
                const currentStats = simRef.current.stats;
                const currentPower = simRef.current.powerStats;
                const hitRate = currentStats.accesses > 0 ? (currentStats.hits / currentStats.accesses) * 100 : 0;

                // Manually update history state (simplified for performance)
                // In a real app, we might store full history snapshot or re-calculate.
                // Here we will just update the final state after loop.
            }
        } else {
            // Fast forward
            for (let i = stepIndex; i < targetStep; i++) {
                const line = trace[i];
                let type = 'Read';
                let addr = line;
                let val = null;
                if (line.includes('=')) {
                    type = 'Write';
                    const parts = line.split('=').map(s => s.trim());
                    addr = parts[0];
                    val = parts[1];
                } else if (line.toLowerCase().startsWith('write')) {
                    type = 'Write';
                    const parts = line.split(/\s+/);
                    addr = parts[1];
                    val = parts[2] || 0;
                }
                simRef.current.access(addr, type, val);
            }
        }

        setStepIndex(targetStep);
        syncState();
    }, [stepIndex, trace, syncState]);

    // Playback Loop
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = setInterval(() => {
                step();
            }, speed);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, speed, step]);

    // Auto-stop if done
    useEffect(() => {
        if (stepIndex >= trace.length && trace.length > 0) {
            setIsPlaying(false);
        }
    }, [stepIndex, trace.length]);

    return {
        config,
        setConfig,
        stats,
        powerStats,
        cacheState,
        lastResult,
        history,
        powerHistory,
        accessLog,
        stepIndex,
        trace,
        isPlaying,
        setIsPlaying,
        speed,
        setSpeed,
        loadTrace,
        step,
        reset,
        seekTo
    };
}
