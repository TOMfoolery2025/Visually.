import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLogHistory } from './hooks/useLogHistory';
import { Header } from './components/Layout/Header';
import { SystemDiagram } from './components/Visualization/SystemDiagram';
import { CPUPage } from './components/Pages/CPUPage';
import { L1Page } from './components/Pages/L1Page';
import { RAMPage } from './components/Pages/RAMPage';
import { TheoryPage } from './components/Pages/TheoryPage';
import { LandingPage } from './components/Pages/LandingPage';
import { DocumentationPage } from './components/Pages/DocumentationPage';
import { LoginOverlay } from './components/Auth/LoginOverlay';
import { Chatbot } from './components/Chatbot/Chatbot';
import { HistoryPage } from './components/Pages/HistoryPage';

function AuthenticatedApp() {
    const { isAuthenticated, logout } = useAuth();
    const [theme, setTheme] = useState('dark');
    const logAction = useLogHistory();
    const location = useLocation();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Log page visits removed to focus on simulation history

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="app-container">
            {!isAuthenticated && <LoginOverlay />}

            <Header theme={theme} toggleTheme={toggleTheme} onLogout={logout} />

            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/docs" element={<DocumentationPage />} />
                <Route path="/simulator" element={<SystemDiagram />} />
                <Route path="/cpu" element={<CPUPage />} />
                <Route path="/l1" element={<L1Page level="L1" />} />
                <Route path="/l2" element={<L1Page level="L2" />} />
                <Route path="/ram" element={<RAMPage />} />
                <Route path="/theory" element={<TheoryPage />} />
                <Route path="/history" element={<HistoryPage />} />
            </Routes>

            <Chatbot />
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthenticatedApp />
        </Router>
    );
}

export default App;
