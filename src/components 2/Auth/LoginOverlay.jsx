import { useState, useEffect } from 'react';

export function LoginOverlay({ onLogin }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const auth = localStorage.getItem('isAuthenticated');
        const user = localStorage.getItem('tum_user');
        if (auth === 'true' && user) {
            setIsAuthenticated(true);
            if (onLogin) onLogin(user);
        }
    }, [onLogin]);

    const handleLogin = async () => {
        if (!email.endsWith('@tum.de') && !email.endsWith('@mytum.de')) {
            setError('Please use a valid TUM email.');
            return;
        }

        const storedAccount = JSON.parse(localStorage.getItem('tum_account') || '{}');
        const hash = await hashPassword(password);

        if (storedAccount.email === email && storedAccount.hash === hash) {
            completeLogin(email);
        } else if (!storedAccount.email) {
            // Auto-provision first user for demo
            const newAccount = { email, hash };
            localStorage.setItem('tum_account', JSON.stringify(newAccount));
            completeLogin(email);
        } else {
            setError('Invalid credentials.');
        }
    };

    const handleRegister = async () => {
        if (!email.endsWith('@tum.de') && !email.endsWith('@mytum.de')) {
            setError('Please use a valid TUM email.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        const hash = await hashPassword(password);
        localStorage.setItem('tum_account', JSON.stringify({ email, hash }));
        setMode('login');
        setError('');
        alert('Account created! Please log in.');
    };

    const handleGuest = () => {
        completeLogin('guest');
    };

    const completeLogin = (user) => {
        localStorage.setItem('tum_user', user);
        localStorage.setItem('isAuthenticated', 'true');
        // Call parent handler to update App state
        if (onLogin) {
            onLogin(user);
        }
    };

    async function hashPassword(msg) {
        const msgBuffer = new TextEncoder().encode(msg);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    if (isAuthenticated) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[color:var(--bg-color)] p-4">
            <div className="bg-[color:var(--surface-1)] w-full max-w-4xl rounded-lg border border-[color:var(--border-color)] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* Left Pane (Hero) */}
                <div className="md:w-1/2 bg-[color:var(--accent-color)] p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]"></div>
                    <div className="relative z-10">
                        <div className="text-sm font-bold tracking-widest uppercase mb-4 opacity-80">TUM Computer Architecture</div>
                        <h1 className="text-5xl font-bold mb-6 leading-tight">Master the<br />Memory<br />Hierarchy.</h1>
                        <p className="text-lg opacity-90">Interactive simulation of cache behavior, replacement policies, and energy metrics.</p>
                    </div>
                    <div className="relative z-10 text-sm opacity-70">v3.0 • React Edition</div>
                </div>

                {/* Right Pane (Form) */}
                <div className="md:w-1/2 p-12 flex flex-col justify-center bg-[color:var(--surface-1)]">
                    <div className="max-w-md mx-auto w-full">
                        <h2 className="text-3xl font-bold mb-2 text-[color:var(--text-primary)]">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-[color:var(--text-secondary)] mb-8">
                            {mode === 'login' ? 'Enter your TUM credentials to access the lab.' : 'Sign up to save your simulation progress.'}
                        </p>

                        {/* Tabs */}
                        <div className="flex bg-[color:var(--surface-2)] p-1 rounded-lg mb-8 border border-[color:var(--border-color)]">
                            <button
                                onClick={() => setMode('login')}
                                className={`flex-1 py-2 rounded text-sm font-medium transition-all ${mode === 'login' ? 'bg-[color:var(--surface-1)] text-[color:var(--accent-color)] shadow-sm' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => setMode('register')}
                                className={`flex-1 py-2 rounded text-sm font-medium transition-all ${mode === 'register' ? 'bg-[color:var(--surface-1)] text-[color:var(--accent-color)] shadow-sm' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
                            >
                                Register
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="glass-input w-full px-4 py-3"
                                    placeholder="name@tum.de"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="glass-input w-full px-4 py-3"
                                    placeholder="••••••••"
                                />
                            </div>

                            {mode === 'register' && (
                                <div>
                                    <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        className="glass-input w-full px-4 py-3"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            {error && <div className="text-[color:var(--danger-color)] text-sm">{error}</div>}

                            <button
                                onClick={mode === 'login' ? handleLogin : handleRegister}
                                className="w-full py-3 btn-primary rounded-lg text-base shadow-md"
                            >
                                {mode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[color:var(--border-color)]"></div></div>
                                <div className="relative flex justify-center text-sm"><span className="px-2 bg-[color:var(--surface-1)] text-[color:var(--text-secondary)]">Or continue with</span></div>
                            </div>

                            <button
                                onClick={handleGuest}
                                className="w-full py-3 btn-secondary rounded-lg text-base"
                            >
                                Guest Access
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
