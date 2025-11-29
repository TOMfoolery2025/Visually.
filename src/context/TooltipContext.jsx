import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

const TooltipContext = createContext(null);

export function TooltipProvider({ children }) {
    const [content, setContent] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const showTooltip = (title, body) => {
        setContent({ title, body });
        setIsVisible(true);
    };

    const hideTooltip = () => {
        setIsVisible(false);
        setTimeout(() => setContent(null), 200); // Wait for fade out
    };

    return (
        <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
            {children}
            {/* Tooltip Overlay */}
            <div className={`tooltip-overlay ${isVisible ? '' : 'hidden'}`} onClick={hideTooltip}>
                <div className="tooltip-content" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>{content?.title}</h3>
                        <button onClick={hideTooltip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={20} />
                        </button>
                    </div>
                    <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
                        {content?.body}
                    </div>
                </div>
            </div>
        </TooltipContext.Provider>
    );
}

export function useTooltip() {
    const context = useContext(TooltipContext);
    if (!context) {
        throw new Error('useTooltip must be used within a TooltipProvider');
    }
    return context;
}
