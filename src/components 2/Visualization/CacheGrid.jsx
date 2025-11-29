import { useState } from 'react';
import { Grid, List, Search } from 'lucide-react';

export function CacheGrid({ sim }) {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [filter, setFilter] = useState('');

    // Use sim.cache directly if available, otherwise fallback to empty array
    // Ensure we display a fixed number of sets (e.g., 16) for the grid visualization
    const cacheSize = 16;
    const cacheState = sim.cache && sim.cache.length > 0
        ? sim.cache.slice(0, cacheSize)
        : Array.from({ length: cacheSize }).map(() => ({ valid: false, dirty: false, tag: '0', data: 0 }));

    // Helper to format address
    const formatAddr = (addr) => {
        if (!addr) return '0x000';
        return `0x${parseInt(addr).toString(16).toUpperCase().padStart(3, '0')}`;
    };

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[color:var(--text-primary)] flex items-center gap-2">
                    <Grid className="text-[color:var(--accent-color)]" /> L1 Cache State
                </h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[color:var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search Tag..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-8 pr-2 py-1 text-xs bg-[color:var(--surface-2)] border border-[color:var(--glass-border)] rounded-md focus:border-[color:var(--accent-color)] outline-none w-32 transition-all"
                        />
                    </div>
                    <div className="flex bg-[color:var(--surface-2)] rounded-md p-0.5 border border-[color:var(--glass-border)]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[color:var(--accent-color)] text-white' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
                        >
                            <Grid size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1 rounded ${viewMode === 'list' ? 'bg-[color:var(--accent-color)] text-white' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
                        >
                            <List size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-4 gap-3">
                        {cacheState.map((block, i) => (
                            <div
                                key={i}
                                className={`
                            relative p-3 rounded-lg border transition-all duration-300
                            ${block.valid
                                        ? (block.dirty
                                            ? 'bg-[color:var(--warning-color)]/10 border-[color:var(--warning-color)] shadow-[0_0_10px_rgba(255,170,0,0.2)]'
                                            : 'bg-[color:var(--success-color)]/10 border-[color:var(--success-color)] shadow-[0_0_10px_rgba(0,255,157,0.2)]')
                                        : 'bg-[color:var(--surface-1)] border-[color:var(--glass-border)] opacity-50'
                                    }
                        `}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-mono text-[color:var(--text-secondary)]">Set {i}</span>
                                    {block.valid && (
                                        <span className={`text-[10px] font-bold ${block.dirty ? 'text-[color:var(--warning-color)]' : 'text-[color:var(--success-color)]'}`}>
                                            {block.dirty ? 'DIRTY' : 'VALID'}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-mono font-bold text-[color:var(--text-primary)] truncate">
                                    {block.valid ? formatAddr(block.tag) : 'EMPTY'}
                                </div>
                                <div className="mt-1 h-1 w-full bg-[color:var(--surface-strong)] rounded-full overflow-hidden">
                                    {block.valid && (
                                        <div className={`h-full w-full ${block.dirty ? 'bg-[color:var(--warning-color)]' : 'bg-[color:var(--success-color)]'} opacity-50`}></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {cacheState.map((block, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-[color:var(--surface-1)] border border-[color:var(--glass-border)] rounded hover:bg-[color:var(--surface-2)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-[color:var(--text-secondary)] w-8">#{i}</span>
                                    <span className={`font-mono font-bold ${block.valid ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)] opacity-50'}`}>
                                        {block.valid ? formatAddr(block.tag) : 'EMPTY'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {block.valid && (
                                        <>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${block.dirty ? 'bg-[color:var(--warning-color)]/20 text-[color:var(--warning-color)]' : 'bg-[color:var(--success-color)]/20 text-[color:var(--success-color)]'}`}>
                                                {block.dirty ? 'D' : 'V'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
