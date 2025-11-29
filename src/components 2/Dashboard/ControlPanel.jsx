import { useState } from 'react';
import { Play, RotateCcw, Settings, Code } from 'lucide-react';
import { AssemblyEditor } from '../Editor/AssemblyEditor';
import { InfoTooltip } from '../Common/InfoTooltip';

export function ControlPanel({ sim }) {
    const { config, setConfig, isPlaying, setIsPlaying, reset, loadTrace, step } = sim;
    const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'assembly'

    const presets = [
        { name: 'Sequential', trace: "0x100\n0x104\n0x108\n0x10C\n0x110" },
        { name: 'Looping', trace: "0x100\n0x104\n0x100\n0x104\n0x100" },
        { name: 'Random', trace: Array.from({ length: 20 }, () => `0x${Math.floor(Math.random() * 1000).toString(16)}`).join('\n') },
        { name: 'Matrix', trace: "0x100\n0x104\n0x200\n0x204\n0x108\n0x10C" },
        { name: 'Conflict', trace: "0x000\n0x400\n0x800\n0xC00\n0x000" }, // Assuming 1024 cache size
        { name: 'Variables', trace: "Write 0x1000 5\nWrite 0x1004 10\n0x1000\n0x1004\nWrite 0x1000 6" }
    ];

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: name === 'replacementPolicy' ? value : Number(value)
        }));
    };

    const loadPreset = (type) => {
        // Helper for legacy preset buttons if needed, but we use direct trace loading now
        // Keeping logic just in case
    };

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[color:var(--text-primary)] font-mono flex items-center gap-2">
                    <Settings className="text-[color:var(--accent-color)]" /> Control Panel
                </h2>
                <div className="flex gap-2 bg-[color:var(--surface-2)] p-1 rounded-lg border border-[color:var(--glass-border)]">
                    <button
                        onClick={() => setActiveTab('presets')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'presets' ? 'bg-[color:var(--accent-color)] text-white shadow-md' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
                    >
                        Presets
                    </button>
                    <button
                        onClick={() => setActiveTab('assembly')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeTab === 'assembly' ? 'bg-[color:var(--accent-color)] text-white shadow-md' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
                    >
                        <Code size={12} /> Assembly
                    </button>
                </div>
            </div>

            {activeTab === 'presets' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-3">
                        {presets.map(p => (
                            <button
                                key={p.name}
                                onClick={() => loadTrace(p.trace)}
                                className="btn-secondary text-sm justify-center py-3 hover:border-[color:var(--accent-color)] hover:text-[color:var(--accent-color)]"
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-5 flex-1">
                        <div>
                            <div className="flex items-center mb-2">
                                <label className="block text-xs font-bold text-[color:var(--text-secondary)] uppercase tracking-wider">Cache Size (Bytes)</label>
                                <InfoTooltip content="Total capacity of the L1 Cache in bytes." />
                            </div>
                            <input
                                type="range"
                                name="cacheSize"
                                min="64" max="8192" step="64"
                                value={config.cacheSize}
                                onChange={handleConfigChange}
                                className="w-full accent-[color:var(--accent-color)] cursor-pointer"
                            />
                            <div className="text-right text-sm font-mono text-[color:var(--accent-color)] mt-1">{config.cacheSize} B</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center mb-2">
                                    <label className="block text-xs font-bold text-[color:var(--text-secondary)] uppercase tracking-wider">Block Size</label>
                                    <InfoTooltip content="Size of a single cache line (block) in bytes." />
                                </div>
                                <select
                                    name="blockSize"
                                    value={config.blockSize}
                                    onChange={handleConfigChange}
                                    className="glass-input w-full text-sm py-2"
                                >
                                    <option value="16">16 B</option>
                                    <option value="32">32 B</option>
                                    <option value="64">64 B</option>
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center mb-2">
                                    <label className="block text-xs font-bold text-[color:var(--text-secondary)] uppercase tracking-wider">Associativity</label>
                                    <InfoTooltip content="Number of ways (blocks) per set. Higher associativity reduces conflict misses." />
                                </div>
                                <select
                                    name="associativity"
                                    value={config.associativity}
                                    onChange={handleConfigChange}
                                    className="glass-input w-full text-sm py-2"
                                >
                                    <option value="1">Direct</option>
                                    <option value="2">2-Way</option>
                                    <option value="4">4-Way</option>
                                    <option value="8">8-Way</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center mb-2">
                                <label className="block text-xs font-bold text-[color:var(--text-secondary)] uppercase tracking-wider">Replacement Policy</label>
                                <InfoTooltip content="Algorithm used to decide which block to evict when a set is full." />
                            </div>
                            <select
                                name="replacementPolicy"
                                value={config.replacementPolicy}
                                onChange={handleConfigChange}
                                className="glass-input w-full text-sm py-2"
                            >
                                <option value="LRU">LRU (Least Recently Used)</option>
                                <option value="FIFO">FIFO (First-In First-Out)</option>
                                <option value="RANDOM">Random</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[color:var(--glass-border)]">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-[color:var(--text-secondary)] uppercase font-bold mb-1 block">Speed (ms)</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="2000"
                                    step="10"
                                    value={sim.speed}
                                    onChange={(e) => sim.setSpeed(Number(e.target.value))}
                                    className="w-full accent-[color:var(--accent-color)] h-1.5 bg-[color:var(--surface-strong)] rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="text-right text-xs font-mono text-[color:var(--text-secondary)] mt-1">{sim.speed}ms</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`btn-primary flex-1 justify-center ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                            >
                                {isPlaying ? <span className="flex items-center gap-2">⏸ Pause</span> : <span className="flex items-center gap-2"><Play size={18} /> Run Trace</span>}
                            </button>
                            <button
                                onClick={reset}
                                className="btn-secondary px-4 hover:text-red-400 hover:border-red-400/50"
                                title="Reset Simulation"
                            >
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
                    <AssemblyEditor sim={sim} />
                </div>
            )}
        </div>
    );
}
