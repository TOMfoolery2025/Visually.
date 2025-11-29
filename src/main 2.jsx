import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../style.css';

// Avoid StrictMode to prevent double-invocation of legacy init logic.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
