import { useState, useRef } from 'react';
import { Info } from 'lucide-react';
import { useTooltip } from '../../context/TooltipContext';

export function ConfigPanel({ onStep, onReset, onConfigure, sim, historyLength, viewStep, onJumpToStep, onPlay, onPause, isPlaying, stepIndex, addressSequence, setAddressSequence }) {
    const { showTooltip } = useTooltip();
    const [cacheSize, setCacheSize] = useState(sim.cacheSize || 1024);
    const [blockSize, setBlockSize] = useState(sim.blockSize || 32);
    const [associativity, setAssociativity] = useState(sim.associativity || 1);
    const [policy, setPolicy] = useState(sim.replacementPolicy || 'LRU');

    // Local state for execution control
    const [speed, setSpeed] = useState(1000); // ms per step

    const getLines = () => addressSequence.split('\n').filter(l => l.trim());

    const handleStep = () => {
        const lines = getLines();
        if (stepIndex < lines.length) {
            onStep(lines[stepIndex]);
        }
    };

    const handlePlay = () => {
        if (isPlaying) {
            onPause();
        } else {
            const lines = getLines();
            onPlay(lines, speed);
        }
    };

    const handleRunAll = () => {
        const lines = getLines();
        // Run from current index to end
        for (let i = stepIndex; i < lines.length; i++) {
            onStep(lines[i]);
        }
    };

    // We need to sync currentLineIndex with external stepIndex if possible, 
    // but for now we drive it locally or via the hook's stepIndex.
    // Let's rely on the hook's stepIndex for the timeline.

    const handleReset = () => {
        onReset();
    };

    const handleConfigure = () => {
        onConfigure({
            cacheSize,
            blockSize,
            associativity,
            replacementPolicy: policy,
            staticPower: 50,
            voltage: 1.0
        });
        handleReset();
    };

    const traces = {
        custom: `0x100\n0x104\nvar s = "Hello"\ns\n0x108`,
        sequential: `0x100\n0x104\n0x108\n0x10C\n0x110\n0x114\n0x118\n0x11C`,
        looping: `0x100\n0x104\n0x108\n0x100\n0x104\n0x108\n0x100\n0x104\n0x108`,
        random: `0x4A0\n0x120\n0x9F0\n0x040\n0x880\n0x3C0\n0x100\n0x550`,
        matrix: `0x100\n0x200\n0x300\n0x104\n0x204\n0x304\n0x108\n0x208\n0x308`,
        conflict: `0x000\n0x400\n0x800\n0xC00\n0x000\n0x400\n0x800\n0xC00`,
        variables: `var a = 10\nvar b = 20\nvar c = a + b\nc\n0x100`,
        assembly: `ADDI x1, x0, 5\nADDI x2, x0, 10\nADD x3, x1, x2\nSW x3, 0x100(x0)\nLW x4, 0x100(x0)`
    };

    const handleTraceChange = (e) => {
        const selected = e.target.value;
        if (traces[selected]) {
            setAddressSequence(traces[selected]);
            handleReset();
        }
    };

    const showConfigInfo = () => {
        showTooltip(
            "Configuration Formulas",
            <div>
                <p><strong>Number of Sets:</strong> <span className="tooltip-formula">Sets = Cache Size / (Block Size × Ways)</span></p>
                <p><strong>Address Breakdown (32-bit):</strong></p>
                <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                    <li><span className="tooltip-formula">Offset Bits = log₂(Block Size)</span></li>
                    <li><span className="tooltip-formula">Index Bits = log₂(Number of Sets)</span></li>
                    <li><span className="tooltip-formula">Tag Bits = 32 - (Index + Offset)</span></li>
                </ul>
                <hr style={{ margin: '10px 0', borderColor: 'var(--glass-border)' }} />
                <p><strong>Associativity:</strong></p>
                <p>Direct Mapped (1-way): 1 block per set.</p>
                <p>N-way Set Associative: N blocks per set.</p>
            </div>
        );
    };

    return (
        <section className="config-panel glass-panel">
            <div className="panel-header">
                <h2>Configuration</h2>
                <div className="tooltip-trigger" onClick={showConfigInfo} style={{ cursor: 'pointer' }}>
                    <Info size={16} />
                </div>
            </div>

            <div className="config-group">
                <h3>Cache Architecture</h3>
                <div className="input-group">
                    <label htmlFor="cacheSize">Cache Size: <span id="cacheSizeDisplay">{cacheSize}</span> Bytes</label>
                    <input
                        type="range"
                        id="cacheSize"
                        value={cacheSize}
                        min="64"
                        max="8192"
                        step="64"
                        onChange={(e) => { setCacheSize(Number(e.target.value)); handleConfigure(); }}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="blockSize">Block Size: <span id="blockSizeDisplay">{blockSize}</span> Bytes</label>
                    <input
                        type="range"
                        id="blockSize"
                        value={blockSize}
                        min="4"
                        max="128"
                        step="4"
                        onChange={(e) => { setBlockSize(Number(e.target.value)); handleConfigure(); }}
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="associativity">Associativity</label>
                    <select
                        id="associativity"
                        value={associativity}
                        onChange={(e) => { setAssociativity(Number(e.target.value)); handleConfigure(); }}
                    >
                        <option value="1">Direct Mapped (1-way)</option>
                        <option value="2">2-way Set Associative</option>
                        <option value="4">4-way Set Associative</option>
                        <option value="8">8-way Set Associative</option>
                        <option value="0">Fully Associative</option>
                    </select>
                </div>
                <div className="input-group">
                    <label htmlFor="replacementPolicy">Replacement Policy</label>
                    <select
                        id="replacementPolicy"
                        value={policy}
                        onChange={(e) => { setPolicy(e.target.value); handleConfigure(); }}
                    >
                        <option value="LRU">Least Recently Used (LRU)</option>
                        <option value="FIFO">First-In-First-Out (FIFO)</option>
                        <option value="RANDOM">Random</option>
                    </select>
                </div>
            </div>

            <div className="config-group">
                <h3>Workload / Assembly</h3>
                <div className="input-group">
                    <label htmlFor="traceExample">Load Example</label>
                    <select id="traceExample" onChange={handleTraceChange}>
                        <option value="assembly">RISC-V Assembly</option>
                        <option value="custom">Custom Sequence</option>
                        <option value="sequential">Sequential</option>
                        <option value="looping">Looping</option>
                        <option value="random">Random</option>
                        <option value="matrix">Matrix Mult</option>
                        <option value="conflict">Conflict Demo</option>
                    </select>
                </div>
                <div className="input-group">
                    <label htmlFor="addressSequence">Code / Trace</label>
                    <div className="help-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Enter Assembly or Addresses</span>
                        <span>Line: {stepIndex + 1}</span>
                    </div>
                    <textarea
                        id="addressSequence"
                        placeholder="ADDI x1, x0, 10..."
                        value={addressSequence}
                        onChange={(e) => setAddressSequence(e.target.value)}
                        style={{ fontFamily: 'monospace', height: '150px' }}
                    ></textarea>
                </div>
            </div>
            <div className="button-group">
                <button id="stepSimulation" className="btn-secondary" title="Execute Next Step" onClick={handleStep}>
                    Step
                </button>
                <button id="playSimulation" className="btn-secondary" title="Auto Play" onClick={handlePlay}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button id="runSimulation" className="btn-primary" title="Run All Remaining" onClick={handleRunAll}>
                    Run All
                </button>
                <button id="resetSimulation" className="secondary-btn" onClick={handleReset}>Reset</button>
            </div>

            <div className="playback-controls">
                <div className="control-row">
                    <label htmlFor="timelineScrubber">Timeline ({viewStep === -1 ? historyLength : viewStep} / {historyLength})</label>
                    <input
                        type="range"
                        id="timelineScrubber"
                        min="0"
                        max={historyLength}
                        value={viewStep === -1 ? historyLength : viewStep}
                        onChange={(e) => onJumpToStep(Number(e.target.value))}
                        disabled={historyLength === 0}
                    />
                </div>
                <div className="control-row">
                    <label htmlFor="speedSlider">Speed: {speed}ms</label>
                    <input
                        type="range"
                        id="speedSlider"
                        min="100"
                        max="2000"
                        step="100"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        style={{ direction: 'rtl' }}
                    />
                </div>
                <div className="control-row">
                    <label>Progress:</label>
                    <progress value={stepIndex} max={getLines().length} style={{ width: '100%' }}></progress>
                </div>
            </div>
        </section>
    );
}
