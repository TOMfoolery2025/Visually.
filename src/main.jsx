import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { SimulatorProvider } from './context/SimulatorContext';
import { TooltipProvider } from './context/TooltipContext';

import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register ChartJS components globally
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

import { AuthProvider } from './context/AuthContext';

// ... imports

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <SimulatorProvider>
                <TooltipProvider>
                    <App />
                </TooltipProvider>
            </SimulatorProvider>
        </AuthProvider>
    </React.StrictMode>,
)
