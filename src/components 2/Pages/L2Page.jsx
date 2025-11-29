import { ArrowLeft, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export function L2Page({ sim }) {
    // Mock L2 Data (4 Sets, 2 Ways for demo)
    const sets = [0, 1, 2, 3];
    const ways = [0, 1];

    return (
        <div className="min-h-screen bg-[color:var(--bg-color)] text-[color:var(--text-primary)] p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center gap-4 mb-8">
                    <Link to="/" className="p-2 rounded-full bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-strong)] transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Database size={32} className="text-[color:var(--accent-color)]" />
                        L2 Cache Details
                    </h1>
                </header>

                <div className="glass-panel p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Cache Content</h2>
                        <div className="flex gap-4 text-sm text-[color:var(--text-secondary)]">
                            <span>Size: 1MB</span>
                            <span>Associativity: 8-Way</span>
                            <span>Block Size: 64B</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[color:var(--glass-border)] text-[color:var(--text-secondary)] text-sm uppercase">
                                    <th className="p-4 font-semibold">Set Index</th>
                                    {ways.map(w => (
                                        <th key={w} className="p-4 font-semibold text-center bg-[color:var(--surface-2)]/30 rounded-t-lg mx-1">Way {w}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="font-mono text-sm">
                                {sets.map(set => (
                                    <tr key={set} className="border-b border-[color:var(--glass-border)] hover:bg-[color:var(--surface-2)] transition-colors">
                                        <td className="p-4 font-bold text-[color:var(--accent-color)]">0x{set.toString(16).toUpperCase().padStart(2, '0')}</td>
                                        {ways.map(w => (
                                            <td key={w} className="p-2">
                                                <div className="bg-[color:var(--surface-1)] border border-[color:var(--glass-border)] rounded p-2 flex flex-col gap-1">
                                                    <div className="flex justify-between text-xs text-[color:var(--text-secondary)]">
                                                        <span>V:1</span>
                                                        <span>D:0</span>
                                                    </div>
                                                    <div className="text-center font-bold">0x1A{set}{w}</div>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-6 text-center text-[color:var(--text-secondary)] text-sm">
                        Showing first 4 sets for demonstration.
                    </div>
                </div>
            </div>
        </div>
    );
}
