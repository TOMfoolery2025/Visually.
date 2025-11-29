import { useNavigate } from 'react-router-dom';
import { Cpu, Zap, Layers, Database } from 'lucide-react';

export function SystemDiagram() {
    const navigate = useNavigate();

    return (
        <section className="view active">
            <div className="system-diagram-container">
                <h2>System Architecture Overview</h2>
                <p className="subtitle">Click on a component to inspect details</p>

                <div className="system-diagram">
                    <div className="sys-component cpu-unit" onClick={() => navigate('/cpu')}>
                        <div className="icon">
                            <Cpu size={48} strokeWidth={1.5} />
                        </div>
                        <h3>CPU Core</h3>
                        <div className="stats-mini">
                            <div>PC: <span id="sys-pc">0x1000</span></div>
                        </div>
                        <div className="hover-hint">Click to Inspect</div>
                    </div>

                    <div className="sys-bus bus-l1">
                        <div className="bus-arrow"></div>
                    </div>

                    <div className="sys-component cache-unit l1-cache" onClick={() => navigate('/l1')}>
                        <div className="icon">
                            <Zap size={48} strokeWidth={1.5} />
                        </div>
                        <h3>L1 Cache</h3>
                        <div className="stats-mini">
                            <div>Hit Rate: <span id="sys-l1-hit">0%</span></div>
                        </div>
                        <div className="hover-hint">Click to Inspect</div>
                    </div>

                    <div className="sys-bus bus-l2">
                        <div className="bus-arrow"></div>
                    </div>

                    <div className="sys-component cache-unit l2-cache" onClick={() => navigate('/l2')}>
                        <div className="icon">
                            <Layers size={48} strokeWidth={1.5} />
                        </div>
                        <h3>L2 Cache</h3>
                        <div className="stats-mini">
                            <div>Hit Rate: <span id="sys-l2-hit">0%</span></div>
                        </div>
                        <div className="hover-hint">Click to Inspect</div>
                    </div>

                    <div className="sys-bus bus-ram">
                        <div className="bus-arrow"></div>
                    </div>

                    <div className="sys-component ram-unit" onClick={() => navigate('/ram')}>
                        <div className="icon">
                            <Database size={48} strokeWidth={1.5} />
                        </div>
                        <h3>Main Memory</h3>
                        <div className="stats-mini">
                            <div>Size: 4GB</div>
                        </div>
                        <div className="hover-hint">Click to Inspect</div>
                    </div>
                </div>

                <div className="global-controls">
                    <button className="btn-primary" onClick={() => navigate('/l1')}>Start Simulation (L1 View)</button>
                </div>
            </div>
        </section>
    );
}
