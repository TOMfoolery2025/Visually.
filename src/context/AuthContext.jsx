import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!token);

    useEffect(() => {
        try {
            if (token) {
                // Ideally verify token with backend, but for now trust local storage presence
                // and decode if needed.
                setIsAuthenticated(true);
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            }
        } catch (error) {
            console.error("Auth initialization error:", error);
            // Clear corrupt state
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
        }
    }, [token]);

    const login = async (username, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const register = async (username, email, password) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Non-JSON response:", text);
                throw new Error("Server returned non-JSON response. Check console for details.");
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            return { success: true };
        } catch (err) {
            console.error("Registration failed:", err);
            return { success: false, error: err.message };
        }
    };

    const loginGuest = () => {
        const guestUser = { username: 'Guest', isGuest: true };
        setUser(guestUser);
        setIsAuthenticated(true);
        // Do not save token for guest
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, loginGuest, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
