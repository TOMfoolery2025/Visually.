import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { SystemDiagram } from './components/Visualization/SystemDiagram';
import { CPUPage } from './components/Pages/CPUPage';
import { L1Page } from './components/Pages/L1Page';
import { RAMPage } from './components/Pages/RAMPage';
import { TheoryPage } from './components/Pages/TheoryPage';
import { LoginOverlay } from './components/Auth/LoginOverlay';
import { Chatbot } from './components/Chatbot/Chatbot';

function App() {
    const [theme, setTheme] = useState('dark');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <Router>
            <div className="app-container">
                {!isAuthenticated && <LoginOverlay onLogin={() => setIsAuthenticated(true)} />}

                <Header theme={theme} toggleTheme={toggleTheme} onLogout={() => setIsAuthenticated(false)} />

                <Routes>
                    <Route path="/" element={<SystemDiagram />} />
                    <Route path="/cpu" element={<CPUPage />} />
                    <Route path="/l1" element={<L1Page level="L1" />} />
                    <Route path="/l2" element={<L1Page level="L2" />} />
                    <Route path="/ram" element={<RAMPage />} />
                    <Route path="/theory" element={<TheoryPage />} />
                </Routes>

                <Chatbot />
            </div>
        </Router>
    );
}

export default App;
