import { useEffect, useRef } from 'react';

export function WaveformViewer({ sim }) {
    const canvasRef = useRef(null);
    const { history, lastResult, stepIndex } = sim;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas with theme color
        const computedStyle = getComputedStyle(document.body);
        const bgColor = computedStyle.getPropertyValue('--surface-2').trim() || '#0f1826';
        const gridColor = computedStyle.getPropertyValue('--glass-border').trim() || 'rgba(48, 112, 179, 0.1)';

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // Draw Grid
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        const gridSize = 40;

        // Vertical grid lines
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Signals to draw
        const signals = [
            { name: 'CLK', color: '#00d2d3', y: 40 },
            { name: 'HIT', color: '#00b894', y: 100 },
            { name: 'MISS', color: '#d63031', y: 160 },
            { name: 'WE', color: '#fdcb6e', y: 220 } // Write Enable
        ];

        // Draw Labels
        ctx.font = '10px "Fira Code", monospace';
        ctx.textAlign = 'left';
        signals.forEach(sig => {
            ctx.fillStyle = sig.color;
            ctx.fillText(sig.name, 10, sig.y - 10);
        });

        // Draw Waveforms
        // We need history of hits/misses to draw this.
        // The `history` object has `hitRate` and `energy`, but not per-cycle signal states.
        // We can infer some states or we might need to track them explicitly.
        // For now, let's simulate the clock and use history length for time.

        const timeScale = 40; // pixels per step
        const maxStepsVisible = Math.ceil(width / timeScale);
        const startStep = Math.max(0, stepIndex - maxStepsVisible + 2);

        signals.forEach(sig => {
            ctx.beginPath();
            ctx.strokeStyle = sig.color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';

            let prevX = 0;
            let prevY = sig.y;

            for (let i = 0; i < maxStepsVisible; i++) {
                const currentStep = startStep + i;
                if (currentStep > stepIndex) break;

                const x = i * timeScale + 50; // Offset for labels

                // Determine signal state (High/Low)
                let isHigh = false;

                if (sig.name === 'CLK') {
                    // Clock toggles every step
                    isHigh = currentStep % 2 === 0;
                } else if (sig.name === 'HIT') {
                    // Check if this step was a hit
                    // We need to look at accessLog or history. 
                    // `sim.accessLog` has the data.
                    // Note: accessLog is reversed (newest first).
                    const logEntry = sim.accessLog.find(l => l.step === currentStep);
                    isHigh = logEntry ? logEntry.isHit : false;
                } else if (sig.name === 'MISS') {
                    const logEntry = sim.accessLog.find(l => l.step === currentStep);
                    isHigh = logEntry ? !logEntry.isHit : false;
                } else if (sig.name === 'WE') {
                    // Write Enable - we assume Write operations set this high
                    // We don't track R/W type in log yet, assume Read for now or add to log.
                    // Let's assume low for now until we track it.
                    isHigh = false;
                }

                const y = isHigh ? sig.y - 20 : sig.y;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    // Square wave logic
                    ctx.lineTo(x, prevY); // Horizontal to new X
                    ctx.lineTo(x, y);     // Vertical to new Y
                }

                ctx.lineTo(x + timeScale, y); // Hold value

                prevX = x + timeScale;
                prevY = y;
            }
            ctx.stroke();
        });

        // Draw "Live" cursor line
        const cursorX = (stepIndex - startStep) * timeScale + 50;
        if (cursorX > 50 && cursorX < width) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.moveTo(cursorX, 0);
            ctx.lineTo(cursorX, height);
            ctx.stroke();
            ctx.setLineDash([]);
        }

    }, [sim, history, lastResult, stepIndex]);

    return (
        <div className="glass-panel w-full mb-6 p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">Signal Waveforms</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => sim.setIsPlaying(!sim.isPlaying)}
                            className="p-1.5 rounded-md bg-[color:var(--surface-2)] border border-[color:var(--glass-border)] hover:border-[color:var(--accent-color)] text-[color:var(--text-primary)] transition-all"
                        >
                            {sim.isPlaying ? '⏸' : '▶'}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max={sim.trace.length}
                            value={stepIndex}
                            onChange={(e) => sim.seekTo(parseInt(e.target.value))}
                            className="w-32 md:w-48 accent-[color:var(--accent-color)] h-2 bg-[color:var(--surface-strong)] rounded-lg appearance-none cursor-pointer z-20 relative"
                        />
                        <span className="text-xs font-mono text-[color:var(--text-secondary)] w-16 text-right">
                            {stepIndex} / {sim.trace.length}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-[color:var(--glass-border)]"></div>
                    <span className="text-[10px] font-mono text-[color:var(--accent-color)]">CLK: {(1 / sim.speed * 1000).toFixed(1)} Hz</span>
                </div>
            </div>
            <div className="w-full overflow-hidden bg-[color:var(--surface-2)] rounded-lg border border-[color:var(--glass-border)] shadow-inner relative group">
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={260}
                    className="w-full h-[260px]"
                />
                {/* Hover overlay for scrubbing hint */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                    <span className="text-xs text-white/50 bg-black/50 px-2 py-1 rounded">Drag slider to scrub time</span>
                </div>
            </div>
        </div>
    );
}
