import React, { createContext, useContext } from 'react';
import { useSimulator } from '../hooks/useSimulator';

const SimulatorContext = createContext(null);

export function SimulatorProvider({ children }) {
    const simulator = useSimulator();

    return (
        <SimulatorContext.Provider value={simulator}>
            {children}
        </SimulatorContext.Provider>
    );
}

export function useSimulatorContext() {
    const context = useContext(SimulatorContext);
    if (!context) {
        throw new Error('useSimulatorContext must be used within a SimulatorProvider');
    }
    return context;
}
