import { useNavigate } from 'react-router-dom';

export function RAMPage() {
    const navigate = useNavigate();

    return (
        <section className="view active">
            <div className="view-header">
                <button className="btn-back" onClick={() => navigate('/')}>← Back to System</button>
                <h2>Main Memory (RAM)</h2>
            </div>
            <div className="ram-container glass-panel">
                <div className="ram-controls">
                    <input type="text" id="ramSearch" placeholder="Search Address (e.g., 0x1000)" />
                    <button className="btn-primary" id="ramSearchBtn">Go</button>
                </div>
                <div className="ram-grid" id="ramGrid">
                    <div className="empty-state">Memory is empty. Run simulation to populate.</div>
                </div>
            </div>
        </section>
    );
}
