export function Logs({ sim }) {
    const { history, trace, accessLog } = sim;
    // History in hook tracks arrays, but for logs we might want a list of objects.
    // The hook currently stores arrays for charts.
    // I should probably update the hook to store a "log" array of objects for the table.
    // For now, I'll reconstruct it from the history arrays if possible, or just show a placeholder.
    // Actually, let's update the hook to store a proper log.

    // Wait, I can't easily update the hook and all consumers in one go without breaking things.
    // Let's check if `sim.lastResult` is enough? No, that's just the last one.
    // I'll update `useSimulator.js` to add `accessLog` state.

    return (
        <div className="glass-panel flex flex-col h-[400px]">
            <h2 className="text-xl font-semibold mb-4">Access Log</h2>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[color:var(--surface-2)] backdrop-blur-md z-10">
                        <tr>
                            <th className="p-3 border-b border-[color:var(--glass-border)] font-semibold text-[color:var(--text-primary)]">Step</th>
                            <th className="p-3 border-b border-[color:var(--glass-border)] font-semibold text-[color:var(--text-primary)]">Address</th>
                            <th className="p-3 border-b border-[color:var(--glass-border)] font-semibold text-[color:var(--text-primary)]">Result</th>
                            <th className="p-3 border-b border-[color:var(--glass-border)] font-semibold text-[color:var(--text-primary)]">Tag</th>
                            <th className="p-3 border-b border-[color:var(--glass-border)] font-semibold text-[color:var(--text-primary)]">Energy (pJ)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accessLog.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-4 text-center text-[color:var(--text-secondary)] italic">
                                    Run simulation to see logs.
                                </td>
                            </tr>
                        ) : (
                            accessLog.map((entry, i) => (
                                <tr key={i} className="hover:bg-[color:var(--surface-strong)] transition-colors">
                                    <td className="p-3 border-b border-[color:var(--glass-border)]">{entry.step}</td>
                                    <td className="p-3 border-b border-[color:var(--glass-border)] font-mono">{entry.address}</td>
                                    <td className={`p-3 border-b border-[color:var(--glass-border)] font-bold ${entry.isHit ? 'text-[color:var(--success-color)]' : 'text-[color:var(--danger-color)]'}`}>
                                        {entry.isHit ? 'HIT' : 'MISS'}
                                    </td>
                                    <td className="p-3 border-b border-[color:var(--glass-border)] font-mono">{entry.tag.toString(16).toUpperCase()}</td>
                                    <td className="p-3 border-b border-[color:var(--glass-border)]">{(entry.energy / 1000).toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
