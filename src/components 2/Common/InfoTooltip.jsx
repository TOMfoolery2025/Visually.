import { useState } from 'react';
import { Info } from 'lucide-react';

export function InfoTooltip({ content, formula }) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block ml-2">
            <button
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-[color:var(--text-secondary)] hover:text-[color:var(--accent-color)] transition-colors focus:outline-none"
            >
                <Info size={14} />
            </button>

            {isVisible && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[color:var(--surface-strong)] border border-[color:var(--glass-border)] rounded-lg shadow-xl backdrop-blur-md text-sm text-[color:var(--text-primary)]">
                    <div className="font-semibold mb-1">Description</div>
                    <p className="text-xs text-[color:var(--text-secondary)] mb-2">{content}</p>
                    {formula && (
                        <>
                            <div className="font-semibold mb-1 border-t border-[color:var(--glass-border)] pt-1">Formula</div>
                            <code className="text-xs font-mono bg-[color:var(--surface-2)] px-1 py-0.5 rounded block text-center">
                                {formula}
                            </code>
                        </>
                    )}
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[color:var(--surface-strong)] border-b border-r border-[color:var(--glass-border)] rotate-45"></div>
                </div>
            )}
        </div>
    );
}
