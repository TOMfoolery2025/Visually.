import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { SimulatorProvider } from './context/SimulatorContext';
import { TooltipProvider } from './context/TooltipContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <SimulatorProvider>
            <TooltipProvider>
                <App />
            </TooltipProvider>
        </SimulatorProvider>
    </React.StrictMode>,
)
