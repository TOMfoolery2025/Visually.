import { ArrowLeft, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CPUPage({ sim }) {
    // Mock data for now, eventually hook into sim state
    // Use real sim state if available, otherwise fallback
    const registers = sim.registers ? sim.registers.map((val, i) => ({ name: `R${i}`, value: `0x${val.toString(16).toUpperCase().padStart(4, '0')}` })) : [];
    const pc = sim.pc ? `0x${sim.pc.toString(16).toUpperCase().padStart(4, '0')}` : '0x1000';
    const ir = sim.ir ? `0x${sim.ir.toString(16).toUpperCase().padStart(8, '0')}` : 'NOP';
    const aluOp = sim.aluOp || 'IDLE';
    const aluRes = sim.aluResult ? `0x${sim.aluResult.toString(16).toUpperCase()}` : '0x0';

    return (
        <div className="min-h-screen bg-[color:var(--bg-color)] text-[color:var(--text-primary)] p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Link to="/" className="p-2 rounded-full bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-strong)] transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Cpu size={32} className="text-[color:var(--accent-color)]" />
                        CPU Core Internals
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Registers */}
                    <div className="glass-panel p-6 lg:col-span-1">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-8 bg-[color:var(--accent-color)] rounded-full"></span>
                            General Purpose Registers
                        </h2>
                        <div className="space-y-3">
                            {registers.map((reg) => (
                                <div key={reg.name} className="flex justify-between items-center p-3 bg-[color:var(--surface-2)] rounded-lg border border-[color:var(--glass-border)]">
                                    <span className="font-mono font-bold text-[color:var(--accent-color)]">{reg.name}</span>
                                    <span className="font-mono text-[color:var(--text-primary)]">{reg.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pipeline / Control Unit */}
                    <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-[color:var(--surface-2)] rounded-xl border border-[color:var(--glass-border)]">
                                <h3 className="text-sm font-bold text-[color:var(--text-secondary)] uppercase mb-2">Program Counter (PC)</h3>
                                <div className="text-4xl font-mono text-[color:var(--success-color)]">{pc}</div>
                            </div>
                            <div className="p-6 bg-[color:var(--surface-2)] rounded-xl border border-[color:var(--glass-border)]">
                                <h3 className="text-sm font-bold text-[color:var(--text-secondary)] uppercase mb-2">Instruction Register (IR)</h3>
                                <div className="text-2xl font-mono text-[color:var(--text-primary)]">{ir}</div>
                            </div>
                        </div>

                        <div className="flex-1 bg-[color:var(--surface-2)] rounded-xl border border-[color:var(--glass-border)] p-6 relative overflow-hidden">
                            <h3 className="text-lg font-bold mb-4">ALU Operations</h3>
                            <div className="flex items-center justify-center h-48 gap-8">
                                <div className="w-24 h-24 bg-[color:var(--surface-1)] rounded-lg flex items-center justify-center border border-[color:var(--glass-border)] font-mono">Op A</div>
                                <div className="w-32 h-32 bg-[color:var(--accent-color)]/20 rounded-full flex flex-col items-center justify-center border-2 border-[color:var(--accent-color)] relative">
                                    <span className="font-bold text-[color:var(--accent-color)]">{aluOp}</span>
                                    <div className="absolute -bottom-8 text-xs text-[color:var(--text-secondary)]">ALU</div>
                                </div>
                                <div className="w-24 h-24 bg-[color:var(--surface-1)] rounded-lg flex items-center justify-center border border-[color:var(--glass-border)] font-mono">Op B</div>
                            </div>
                            <div className="text-center mt-4">
                                <span className="text-sm text-[color:var(--text-secondary)]">Result: </span>
                                <span className="font-mono font-bold text-[color:var(--success-color)]">{aluRes}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
