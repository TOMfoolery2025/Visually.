import { Cpu, Zap, Database, HardDrive, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SystemDiagram({ sim }) {
    // Helper to get stats safely
    const hitRateL1 = sim.stats && sim.stats.accesses > 0
        ? ((sim.stats.hits / sim.stats.accesses) * 100).toFixed(1) + '%'
        : '0%';

    const hitRateL2 = sim.lastResult && sim.lastResult.l2Hit
        ? 'Hit'
        : 'Miss';

    return (
        <div className="system-diagram-container glass-panel mb-8 p-8 relative overflow-hidden group">
            {/* Background Mesh */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,var(--accent-color)_1px,transparent_1px)] bg-[length:20px_20px]"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Activity size={24} className="text-[color:var(--accent-color)]" />
                        <span>System Architecture</span>
                    </h2>
                    <p className="subtitle text-sm text-[color:var(--text-secondary)] mt-1">Click components to inspect internals</p>
                </div>
                <div className="text-xs font-mono text-[color:var(--accent-color)] bg-[color:var(--accent-color)]/10 px-3 py-1 rounded-full border border-[color:var(--accent-color)]/20 animate-pulse">
                    LIVE SIMULATION
                </div>
            </div>

            <div className="system-diagram flex items-center justify-between relative py-8 px-4 gap-6 overflow-x-auto z-10">
                {/* CPU */}
                <Link
                    to="/cpu"
                    className="sys-component cpu-unit flex flex-col items-center p-5 bg-[color:var(--surface-1)] border border-[color:var(--glass-border)] rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-all hover:shadow-[0_0_30px_rgba(48,112,179,0.2)] hover:border-[color:var(--accent-color)] min-w-[140px] relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    <div className="mb-3 drop-shadow-md text-[color:var(--text-primary)]">
                        <Cpu size={48} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-[color:var(--text-primary)] text-lg">CPU Core</h3>
                    <div className="stats-mini text-xs text-[color:var(--text-secondary)] mt-2 font-mono bg-black/5 px-2 py-1 rounded">
                        PC: <span className="text-[color:var(--accent-color)] font-bold">0x1000</span>
                    </div>
                </Link>

                {/* Bus L1 */}
                <div className="sys-bus flex-1 h-1.5 bg-[color:var(--border-strong)] relative min-w-[60px] rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:var(--accent-color)] to-transparent w-1/2 h-full animate-[shimmer_2s_infinite] opacity-50"></div>
                </div>

                {/* L1 Cache */}
                <div className="sys-component cache-unit l1-cache flex flex-col items-center p-5 bg-[color:var(--surface-1)] border-2 border-[color:var(--accent-color)] rounded-2xl shadow-[0_0_20px_rgba(48,112,179,0.15)] cursor-pointer hover:scale-105 transition-all min-w-[140px] relative">
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-[color:var(--success-color)] rounded-full border-2 border-white shadow-sm animate-bounce"></div>
                    <div className="mb-3 drop-shadow-md text-[color:var(--text-primary)]">
                        <Zap size={48} strokeWidth={1.5} className="fill-[color:var(--accent-color)]/20" />
                    </div>
                    <h3 className="font-bold text-[color:var(--text-primary)] text-lg">L1 Cache</h3>
                    <div className="stats-mini text-xs text-[color:var(--text-secondary)] mt-2 font-mono bg-black/5 px-2 py-1 rounded">
                        Hit Rate: <span className="text-[color:var(--success-color)] font-bold">{hitRateL1}</span>
                    </div>
                </div>

                {/* Bus L2 */}
                <div className="sys-bus flex-1 h-1.5 bg-[color:var(--border-strong)] relative min-w-[60px] rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:var(--accent-color)] to-transparent w-1/2 h-full animate-[shimmer_3s_infinite] opacity-30"></div>
                </div>

                {/* L2 Cache */}
                <Link
                    to="/l2"
                    className="sys-component cache-unit l2-cache flex flex-col items-center p-5 bg-[color:var(--surface-1)] border border-[color:var(--glass-border)] rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-all hover:border-[color:var(--accent-color)] min-w-[140px] opacity-90"
                >
                    <div className="mb-3 drop-shadow-md text-[color:var(--text-secondary)]">
                        <Database size={48} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-[color:var(--text-primary)] text-lg">L2 Cache</h3>
                    <div className="stats-mini text-xs text-[color:var(--text-secondary)] mt-2 font-mono bg-black/5 px-2 py-1 rounded">
                        Status: <span className={hitRateL2 === 'Hit' ? 'text-[color:var(--success-color)]' : 'text-[color:var(--danger-color)]'}>{hitRateL2}</span>
                    </div>
                </Link>

                {/* Bus RAM */}
                <div className="sys-bus flex-1 h-1.5 bg-[color:var(--border-strong)] relative min-w-[60px] rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:var(--accent-color)] to-transparent w-1/2 h-full animate-[shimmer_4s_infinite] opacity-20"></div>
                </div>

                {/* RAM */}
                <Link
                    to="/memory"
                    className="sys-component ram-unit flex flex-col items-center p-5 bg-[color:var(--surface-1)] border border-[color:var(--glass-border)] rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-all hover:border-[color:var(--accent-color)] min-w-[140px]"
                >
                    <div className="mb-3 drop-shadow-md text-[color:var(--text-primary)]">
                        <HardDrive size={48} strokeWidth={1.5} />
                    </div>
                    <h3 className="font-bold text-[color:var(--text-primary)] text-lg">Main Memory</h3>
                    <div className="stats-mini text-xs text-[color:var(--text-secondary)] mt-2 font-mono bg-black/5 px-2 py-1 rounded">
                        Size: 4GB
                    </div>
                </Link>
            </div>
        </div>
    );
}
