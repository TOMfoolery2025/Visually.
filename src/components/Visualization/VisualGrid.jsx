import React from 'react';

export function VisualGrid({ cacheState, blockSize, associativity }) {
    if (!cacheState || cacheState.length === 0) {
        return <div className="empty-state">Run simulation to see cache state</div>;
    }

    return (
        <div className="cache-grid-container">
            {cacheState.map((set, setIndex) => (
                <div key={setIndex} className="set-row">
                    <div className="set-label">Set {setIndex}</div>
                    <div className="cache-set-row">
                        {set.map((block, wayIndex) => (
                            <div
                                key={wayIndex}
                                className={`cache-block ${block.valid ? 'valid' : ''} ${block.dirty ? 'dirty' : ''}`}
                                title={`Tag: ${block.tag}, Data: ${block.data}`}
                            >
                                <div className="block-header">
                                    <span className="tag-label">{block.valid ? `0x${block.tag.toString(16).toUpperCase()}` : '--'}</span>
                                    <div className="indicators">
                                        <div className={`indicator ${block.valid ? 'on' : ''}`} title="Valid Bit"></div>
                                        <div className={`indicator ${block.dirty ? 'on' : ''}`} style={{ background: block.dirty ? '#d63031' : '' }} title="Dirty Bit"></div>
                                    </div>
                                </div>
                                <div className="block-data">
                                    {block.valid ? (block.data !== null && block.data !== undefined ? block.data : '0') : 'Empty'}
                                </div>
                                <div className="block-meta">
                                    LRU: {block.lruCounter}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
