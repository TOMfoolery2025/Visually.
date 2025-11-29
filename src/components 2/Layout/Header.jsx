import { Sun, Moon, Info } from 'lucide-react';

export function Header({ theme, toggleTheme }) {
    // Ensure theme is initialized to dark if not set
    if (!theme) theme = 'dark';
    return (
        <header className="bg-[color:var(--surface-1)] border-b border-[color:var(--border-color)] px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="text-[color:var(--accent-color)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <path d="M22 6l-10 7L2 6"></path>
                    </svg>
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-[color:var(--text-primary)] flex items-center gap-2">
                        TUM Cache Simulator
                        <span className="text-[10px] bg-[color:var(--surface-strong)] text-[color:var(--text-secondary)] px-1.5 py-0.5 rounded border border-[color:var(--border-color)]">v3.0</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)] rounded-md transition-colors" title="Documentation">
                    <Info size={20} />
                </button>
                <div className="h-4 w-px bg-[color:var(--border-color)]"></div>
                <button
                    onClick={toggleTheme}
                    className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)] rounded-md transition-colors"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </header>
    );
}
