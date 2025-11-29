import { useNavigate } from 'react-router-dom';
import { useSimulatorContext } from '../../context/SimulatorContext';

export function CPUPage() {
    const navigate = useNavigate();
    const { logs, stepIndex } = useSimulatorContext();

    // Derive CPU state from the last log entry
    const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
    const currentPC = 0x1000 + (stepIndex * 4);

    // Mock ALU state based on memory access
    // Mock ALU state based on memory access
    const alu = lastLog?.alu || { op: "IDLE", a: "---", b: "---", res: "---" };
    const aluOp = alu.op;
    const opA = typeof alu.a === 'number' ? `0x${alu.a.toString(16).toUpperCase()}` : alu.a;
    const opB = typeof alu.b === 'number' ? `0x${alu.b.toString(16).toUpperCase()}` : alu.b;
    const res = typeof alu.res === 'number' ? `0x${alu.res.toString(16).toUpperCase()}` : alu.res;

    return (
        <section className="view active">
            <div className="view-header">
                <button className="btn-back" onClick={() => navigate('/')}>← Back to System</button>
                <h2>CPU Core & Registers</h2>
            </div>
            <div className="cpu-layout">
                {/* Left Column: Control Path */}
                <div className="cpu-control-path glass-panel">
                    <h3>Control Unit</h3>
                    <div className="reg-box pc-box">
                        <div className="label">Program Counter (PC)</div>
                        <div className="value mono" id="cpu-pc">0x{currentPC.toString(16).toUpperCase()}</div>
                    </div>
                    <div className="reg-box ir-box">
                        <div className="label">Current Instruction</div>
                        <div className="value mono" id="cpu-ir">{lastLog ? `LW x10, ${lastLog.address}(x2)` : "NOP"}</div>
                    </div>

                    <div className="alu-section" style={{ marginTop: '20px' }}>
                        <h3>ALU Operation</h3>
                        <div className="alu-box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="alu-field">
                                <div className="label">Operand A</div>
                                <div className="value mono small">{opA}</div>
                            </div>
                            <div className="alu-field">
                                <div className="label">Operand B</div>
                                <div className="value mono small">{opB}</div>
                            </div>
                            <div className="alu-field full-span" style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                <div className="label">Result</div>
                                <div className="value mono highlight">{res}</div>
                            </div>
                        </div>
                        <div className="alu-status-badge" style={{
                            marginTop: '10px',
                            background: lastLog ? 'var(--success-color)' : 'var(--text-secondary)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '0.8rem'
                        }}>
                            {aluOp}
                        </div>
                    </div>
                </div>

                {/* Right Column: Data Path (Registers) */}
                <div className="cpu-data-path glass-panel">
                    <h3>Register File (x0 - x31)</h3>
                    <div className="registers-grid" id="cpuRegisters">
                        {Array.from({ length: 32 }).map((_, i) => (
                            <div key={i} className={`register-cell ${i === 10 && lastLog ? 'changed' : ''}`}>
                                <span className="reg-name">x{i}</span>
                                <span className="reg-val">
                                    {i === 2 ? '0x7FFFFFF0' : (i === 10 && lastLog ? `0x${lastLog.data || '00'}` : '0x00000000')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
