import { ArrowLeft, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MemoryPage({ sim }) {
    return (
        <div className="min-h-screen bg-[color:var(--bg-color)] text-[color:var(--text-primary)] p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Link to="/" className="p-2 rounded-full bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-strong)] transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <HardDrive size={32} className="text-[color:var(--accent-color)]" />
                        Main Memory (RAM)
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="glass-panel p-6 lg:col-span-1">
                        <h2 className="text-xl font-bold mb-6">Memory Segments</h2>
                        <div className="space-y-2">
                            {['Stack', 'Heap', 'Data', 'Text'].map((seg, i) => (
                                <div key={seg} className="relative h-24 w-full bg-[color:var(--surface-2)] border border-[color:var(--glass-border)] rounded-lg flex items-center justify-center hover:scale-[1.02] transition-transform cursor-pointer group">
                                    <span className="font-bold text-lg">{seg}</span>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[color:var(--accent-color)] rounded-l-lg opacity-50 group-hover:opacity-100"></div>
                                    <div className="absolute right-2 top-2 text-xs font-mono text-[color:var(--text-secondary)]">
                                        0x{((4 - i) * 1000).toString(16)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6 lg:col-span-2">
                        <h2 className="text-xl font-bold mb-6">Memory Map Inspector</h2>
                        <div className="bg-[color:var(--surface-2)] rounded-xl border border-[color:var(--glass-border)] p-4 h-[500px] overflow-y-auto custom-scrollbar font-mono text-sm">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-[color:var(--surface-2)] z-10">
                                    <tr className="text-[color:var(--text-secondary)] border-b border-[color:var(--glass-border)]">
                                        <th className="p-2">Address</th>
                                        <th className="p-2">Value (Hex)</th>
                                        <th className="p-2">Value (Dec)</th>
                                        <th className="p-2">Instruction / Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 20 }).map((_, i) => {
                                        const addr = 0x1000 + (i * 4);
                                        return (
                                            <tr key={i} className="border-b border-[color:var(--glass-border)]/50 hover:bg-[color:var(--surface-1)]">
                                                <td className="p-2 text-[color:var(--accent-color)]">0x{addr.toString(16).toUpperCase()}</td>
                                                <td className="p-2">0x00000000</td>
                                                <td className="p-2 text-[color:var(--text-secondary)]">0</td>
                                                <td className="p-2 text-[color:var(--text-secondary)] opacity-50">NOP</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
