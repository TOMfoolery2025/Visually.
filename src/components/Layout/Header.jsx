import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Cpu, Zap, Layers, Database, Clock } from 'lucide-react';
import './nav-styles.css';

export function Header({ theme, toggleTheme, onLogout }) {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'nav-btn active' : 'nav-btn';
    };

    return (
        <header className="glass-panel">
            <div className="header-content">
                <div className="logo-area">
                    <Link to="/" className="logo-link">
                        <img src="/tum.png" alt="TUM Logo" style={{ height: '45px', width: 'auto' }} />
                    </Link>
                    <div className="title-group">
                        <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Visually.</h1>
                        <p className="subtitle" style={{ fontSize: '0.9rem', opacity: 0.8 }}>Memory Hierarchy Simulator</p>
                    </div>
                </div>

                {/* Simulator Navigation */}
                <nav className="header-nav">
                    <Link to="/simulator" className={isActive('/simulator')}>
                        <LayoutGrid size={18} className="nav-icon" />
                        <span>System</span>
                    </Link>
                    <Link to="/cpu" className={isActive('/cpu')}>
                        <Cpu size={18} className="nav-icon" />
                        <span>CPU</span>
                    </Link>
                    <Link to="/l1" className={isActive('/l1')}>
                        <Zap size={18} className="nav-icon" />
                        <span>L1</span>
                    </Link>
                    <Link to="/l2" className={isActive('/l2')}>
                        <Layers size={18} className="nav-icon" />
                        <span>L2</span>
                    </Link>
                    <Link to="/ram" className={isActive('/ram')}>
                        <Database size={18} className="nav-icon" />
                        <span>RAM</span>
                    </Link>
                </nav>

                <div className="header-controls">
                    <Link to="/history" className="secondary-btn small-btn"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', marginRight: '10px' }}>
                        <Clock size={16} /> <span>History</span>
                    </Link>

                    <Link to="/theory" className="secondary-btn small-btn"
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className="icon">Book</span> Theory
                    </Link>
                    <button
                        id="logoutBtn"
                        className="secondary-btn small-btn"
                        style={{ marginLeft: '5px' }}
                        onClick={onLogout}
                    >
                        <span className="icon">Log Out</span>
                    </button>
                    <button
                        id="themeToggle"
                        className="icon-btn"
                        aria-label="Toggle Theme"
                        title="Toggle Light/Dark Mode"
                        onClick={toggleTheme}
                    >
                        {theme === 'light' ? (
                            <svg className="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                        ) : (
                            <svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
