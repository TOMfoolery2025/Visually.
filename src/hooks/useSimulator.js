import { useState, useRef, useCallback } from 'react';
import { CacheSimulator } from '../lib/simulator';
import { useLogHistory } from './useLogHistory';

export function useSimulator() {
    const simRef = useRef(new CacheSimulator(1024, 32, 1, 'LRU', { staticPower: 50, missPenaltyPower: 200 }, 1.0));

    // History State
    const [history, setHistory] = useState([]);
    const [viewStep, setViewStep] = useState(-1); // -1 means "live" (latest)

    // Current State (Live)
    const [stats, setStats] = useState(simRef.current.stats);
    const [l2Stats, setL2Stats] = useState({ hits: 0, misses: 0, accesses: 0, reads: 0, writes: 0 }); // L2 Stats
    const [powerStats, setPowerStats] = useState(simRef.current.powerStats);
    const [logs, setLogs] = useState([]);
    const [cacheState, setCacheState] = useState(simRef.current.cache);
    const [l2CacheState, setL2CacheState] = useState(simRef.current.l2.sets); // L2 State
    const [memory, setMemory] = useState(simRef.current.memory); // RAM State
    const [stepIndex, setStepIndex] = useState(0);
    const [addressSequence, setAddressSequence] = useState(`ADDI x1, x0, 10\nADDI x2, x0, 20\nADD x3, x1, x2\nSW x3, 0x100(x0)\nLW x4, 0x100(x0)`);

    const [isPlaying, setIsPlaying] = useState(false);
    const playInterval = useRef(null);

    // Helper to deep copy cache state for history
    const deepCopyCache = (cache) => {
        return cache.map(set => set.map(block => ({ ...block })));
    };

    const updateState = useCallback(() => {
        const newStats = { ...simRef.current.stats };

        // Construct full L2 stats object to match L1 stats structure
        const l2Hits = simRef.current.l2.hits;
        const l2Misses = simRef.current.l2.misses;
        const l2Accesses = l2Hits + l2Misses;
        const newL2Stats = {
            hits: l2Hits,
            misses: l2Misses,
            accesses: l2Accesses,
            reads: l2Accesses, // Simplified assumption: all L2 accesses are treated as reads for viz
            writes: 0
        };

        const newPowerStats = { ...simRef.current.powerStats };
        const newCacheState = deepCopyCache(simRef.current.cache);
        const newL2CacheState = deepCopyCache(simRef.current.l2.sets);

        setStats(newStats);
        setL2Stats(newL2Stats);
        setPowerStats(newPowerStats);
        setCacheState(newCacheState);
        setL2CacheState(newL2CacheState);
        setMemory({ ...simRef.current.memory });

        // Add to history
        setHistory(prev => [
            ...prev,
            {
                stats: newStats,
                l2Stats: newL2Stats,
                powerStats: newPowerStats,
                cacheState: newCacheState,
                l2CacheState: newL2CacheState,
                memory: { ...simRef.current.memory },
                stepIndex: simRef.current.currentTime
            }
        ]);
    }, []);

    const step = useCallback((line) => {
        const result = simRef.current.executeLine(line);
        if (result) {
            setLogs(prev => [...prev, { step: prev.length + 1, ...result }]);
        }
        updateState();
        setStepIndex(prev => prev + 1);
        setViewStep(-1);
        return result;
    }, [updateState]);

    const logAction = useLogHistory();

    const play = useCallback((lines, speed = 1000) => {
        if (isPlaying) return;
        setIsPlaying(true);
        setViewStep(-1); // Snap to live

        playInterval.current = setInterval(() => {
            setStepIndex(prev => {
                if (prev >= lines.length) {
                    clearInterval(playInterval.current);
                    setIsPlaying(false);

                    // Log Simulation Result
                    const finalStats = simRef.current.stats;
                    const hitRate = finalStats.accesses > 0 ? ((finalStats.hits / finalStats.accesses) * 100).toFixed(2) : 0;

                    const logData = {
                        config: {
                            cacheSize: simRef.current.cacheSize,
                            blockSize: simRef.current.blockSize,
                            associativity: simRef.current.associativity,
                            replacementPolicy: simRef.current.replacementPolicy
                        },
                        results: {
                            instructions: lines.length,
                            hitRate: `${hitRate}%`,
                            hits: finalStats.hits,
                            misses: finalStats.misses,
                            accesses: finalStats.accesses
                        }
                    };

                    logAction('Simulation Run', JSON.stringify(logData));

                    return prev;
                }
                const line = lines[prev];
                const result = simRef.current.executeLine(line);

                // Update logs
                if (result) {
                    setLogs(currentLogs => [...currentLogs, { step: currentLogs.length + 1, ...result }]);
                }

                return prev + 1;
            });
            updateState();
        }, speed);
    }, [isPlaying, updateState, logAction]);

    const pause = useCallback(() => {
        clearInterval(playInterval.current);
        setIsPlaying(false);
    }, []);

    const reset = useCallback(() => {
        simRef.current.reset();
        setLogs([]);
        setStepIndex(0);
        setHistory([]);
        setViewStep(-1);
        setIsPlaying(false);
        clearInterval(playInterval.current);
        updateState();
    }, [updateState]);

    const configure = useCallback((config) => {
        simRef.current = new CacheSimulator(
            config.cacheSize,
            config.blockSize,
            config.associativity,
            config.replacementPolicy,
            { staticPower: config.staticPower, missPenaltyPower: 200 },
            config.voltage
        );
        reset();
    }, [reset]);

    const jumpToStep = useCallback((stepIdx) => {
        if (stepIdx >= history.length - 1) {
            setViewStep(-1); // Live
        } else {
            setViewStep(stepIdx);
        }
    }, [history.length]);

    // Derived state for View
    const currentView = viewStep === -1 || !history[viewStep]
        ? { stats, l2Stats, powerStats, cacheState, l2CacheState, memory }
        : history[viewStep];

    return {
        sim: simRef.current,
        stats: currentView.stats,
        l2Stats: currentView.l2Stats,
        powerStats: currentView.powerStats,
        logs, // Logs usually show full history, but maybe we want to slice them too? Let's keep full logs for now.
        cacheState: currentView.cacheState,
        l2CacheState: currentView.l2CacheState,
        memory: currentView.memory || simRef.current.memory,
        stepIndex,
        isPlaying,
        historyLength: history.length,
        viewStep: viewStep === -1 ? history.length : viewStep,
        step,
        play,
        pause,
        reset,
        configure,
        jumpToStep,
        addressSequence,
        setAddressSequence
    };
}
