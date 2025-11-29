import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Cpu, Layers, Zap, Database, ArrowLeft, ExternalLink } from 'lucide-react';

export function TheoryPage() {
    const navigate = useNavigate();

    return (
        <section className="view active" style={{ overflowY: 'auto', height: '100%' }}>
            <div className="view-header">
                <button className="btn-back" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Back to Simulator
                </button>
                <h2>Computer Architecture Theory</h2>
            </div>

            <div className="theory-container" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>

                {/* Chapter 1: Memory Hierarchy */}
                <section className="glass-panel" style={{ marginBottom: '30px', padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                        <Layers size={32} color="var(--accent-color)" />
                        <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>1. The Memory Hierarchy</h2>
                    </div>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        In modern computer systems, we want memory to be <strong>fast</strong>, <strong>large</strong>, and <strong>cheap</strong>.
                        However, no single technology satisfies all three.
                    </p>

                    <div className="concept-box" style={{
                        background: 'rgba(48, 112, 179, 0.1)',
                        borderLeft: '4px solid var(--accent-color)',
                        padding: '20px',
                        margin: '20px 0',
                        borderRadius: '0 8px 8px 0'
                    }}>
                        <strong style={{ display: 'block', marginBottom: '10px', color: 'var(--text-primary)' }}>The Principle of Locality</strong>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Programs tend to access a relatively small portion of their address space at any instant of time.</p>
                        <ul style={{ marginTop: '10px', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                            <li style={{ marginBottom: '5px' }}><strong style={{ color: 'var(--text-primary)' }}>Temporal Locality:</strong> If an item is referenced, it will tend to be referenced again soon (e.g., loops).</li>
                            <li><strong style={{ color: 'var(--text-primary)' }}>Spatial Locality:</strong> If an item is referenced, items whose addresses are close by will tend to be referenced soon (e.g., arrays).</li>
                        </ul>
                    </div>

                    <div className="hierarchy-viz" style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '30px 0', alignItems: 'center' }}>
                        <div style={{ width: '200px', padding: '10px', background: '#e74c3c', color: 'white', textAlign: 'center', borderRadius: '8px 8px 0 0', clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' }}>Registers (Fastest)</div>
                        <div style={{ width: '300px', padding: '15px', background: '#e67e22', color: 'white', textAlign: 'center' }}>L1 Cache</div>
                        <div style={{ width: '400px', padding: '20px', background: '#f1c40f', color: 'black', textAlign: 'center' }}>L2 Cache</div>
                        <div style={{ width: '500px', padding: '25px', background: '#2ecc71', color: 'white', textAlign: 'center' }}>Main Memory (RAM)</div>
                        <div style={{ width: '600px', padding: '30px', background: '#3498db', color: 'white', textAlign: 'center', borderRadius: '0 0 8px 8px' }}>Disk / SSD (Largest)</div>
                    </div>
                </section>

                {/* Chapter 2: Cache Organization */}
                <section className="glass-panel" style={{ marginBottom: '30px', padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                        <Database size={32} color="var(--accent-color)" />
                        <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>2. Cache Organization</h2>
                    </div>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        How do we find data in the cache? We divide the memory address into three parts: <strong>Tag</strong>, <strong>Index</strong>, and <strong>Offset</strong>.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Direct Mapped</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Each memory block maps to exactly <strong>one</strong> location. Simple but prone to conflict misses.</p>
                            <code style={{ display: 'block', marginTop: '10px', padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '0.85rem' }}>Index = Addr % Blocks</code>
                        </div>
                        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Set Associative</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Each block can go into any of the <strong>N</strong> ways in a set. Balances complexity and conflict reduction.</p>
                            <code style={{ display: 'block', marginTop: '10px', padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '0.85rem' }}>Set = Addr % Sets</code>
                        </div>
                    </div>
                </section>

                {/* Chapter 3: The 3 C's */}
                <section className="glass-panel" style={{ marginBottom: '30px', padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                        <Zap size={32} color="var(--accent-color)" />
                        <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>3. The 3 C's of Misses</h2>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '15px', padding: '15px', background: 'var(--card-bg)', borderRadius: '10px', borderLeft: '4px solid #3498db' }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Compulsory (Cold)</strong>
                            <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>The first access to a block. It has never been in the cache before.</p>
                        </li>
                        <li style={{ marginBottom: '15px', padding: '15px', background: 'var(--card-bg)', borderRadius: '10px', borderLeft: '4px solid #e74c3c' }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Capacity</strong>
                            <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>The cache is too small to contain all blocks needed. Blocks are discarded and retrieved later.</p>
                        </li>
                        <li style={{ marginBottom: '15px', padding: '15px', background: 'var(--card-bg)', borderRadius: '10px', borderLeft: '4px solid #f1c40f' }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Conflict</strong>
                            <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)' }}>Multiple blocks compete for the same set (Collision) in Direct Mapped or Set Associative caches.</p>
                        </li>
                    </ul>
                </section>

                {/* Chapter 4: RISC-V */}
                <section className="glass-panel" style={{ marginBottom: '30px', padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                        <Cpu size={32} color="var(--accent-color)" />
                        <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>4. RISC-V Context</h2>
                    </div>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>RISC-V is a modern, open Instruction Set Architecture (ISA).</p>
                    <ul style={{ marginTop: '15px', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                        <li style={{ marginBottom: '10px' }}><strong style={{ color: 'var(--text-primary)' }}>Load/Store Architecture:</strong> Only <code>lb</code>, <code>lw</code>, <code>sb</code>, <code>sw</code> access memory.</li>
                        <li style={{ marginBottom: '10px' }}><strong style={{ color: 'var(--text-primary)' }}>Registers:</strong> 32 General Purpose Registers (x0-x31). <code>x0</code> is always 0.</li>
                        <li><strong style={{ color: 'var(--text-primary)' }}>FENCE.I:</strong> Synchronizes Instruction and Data caches.</li>
                    </ul>
                </section>

                {/* External Resources */}
                <section className="glass-panel" style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                        <Book size={32} color="var(--accent-color)" />
                        <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>External Resources</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        {[
                            { title: 'Wikipedia: Cache', desc: 'Comprehensive overview', url: 'https://en.wikipedia.org/wiki/Cache_(computing)' },
                            { title: 'GeeksforGeeks', desc: 'Organization & Mapping', url: 'https://www.geeksforgeeks.org/cache-memory-in-computer-organization/' },
                            { title: 'RISC-V Specs', desc: 'Official Documentation', url: 'https://riscv.org/technical/specifications/' },
                            { title: 'Stanford Guide', desc: 'RISC-V Educational Resources', url: 'https://cs.stanford.edu/people/eroberts/courses/soco/projects/risc/riscv/' }
                        ].map((res, i) => (
                            <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    padding: '20px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    border: '1px solid var(--glass-border)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <strong style={{ color: 'var(--accent-color)', fontSize: '1.1rem' }}>{res.title}</strong>
                                    <ExternalLink size={16} color="var(--text-secondary)" />
                                </div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{res.desc}</span>
                            </a>
                        ))}
                    </div>
                </section>

            </div>
        </section>
    );
}
