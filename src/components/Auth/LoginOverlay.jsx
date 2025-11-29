import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function LoginOverlay() {
    const { login, register, loginGuest } = useAuth();
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setError('');
        setSuccessMsg('');
        setLoading(true);

        if (mode === 'login') {
            if (!username || !password) {
                setError('Please fill in all fields');
                setLoading(false);
                return;
            }
            const result = await login(username, password);
            if (!result.success) setError(result.error || 'Login failed');
        } else {
            // Registration validation
            if (!username || !email || !password || !confirm) {
                setError('Please fill in all fields');
                setLoading(false);
                return;
            }
            if (password !== confirm) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }
            if (password.length < 8) {
                setError('Password must be at least 8 characters');
                setLoading(false);
                return;
            }

            const result = await register(username, email, password);
            if (result.success) {
                setMode('login');
                setSuccessMsg('Registration successful! Please login with your new account.');
                setPassword(''); // Clear password
                setConfirm('');
                setLoading(false);
                return;
            } else {
                setError(result.error || 'Registration failed');
            }
        }
        setLoading(false);
    };

    const handleGuest = () => {
        loginGuest();
    };

    return (
        <div id="loginOverlay" className="login-overlay fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="login-card relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all duration-300 mx-4">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Login Form Section (left) */}
                    <div className="login-pane flex flex-col justify-center p-8 md:p-12 bg-white dark:bg-gray-900">
                        <div className="login-header text-center mb-8">
                            <img src="/tum.png" alt="Visually. Logo" className="h-12 mx-auto mb-4 drop-shadow-md" />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome to Visually.</h2>
                            <p className="subtitle text-sm text-gray-500 dark:text-gray-400 font-medium">Sign in to continue</p>
                        </div>

                        <div className="login-tabs grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
                            <button
                                className={`tab-btn py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${mode === 'login' ? 'active text-tum-blue bg-white shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                            >
                                Login
                            </button>
                            <button
                                className={`tab-btn py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${mode === 'register' ? 'active text-tum-blue bg-white shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                            >
                                Register
                            </button>
                        </div>

                        <div className="login-form space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="p-3 text-sm text-green-600 bg-green-100 dark:bg-green-900/30 rounded-lg text-center font-medium">
                                    {successMsg}
                                </div>
                            )}
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tum-blue/50 focus:border-tum-blue outline-none transition-all placeholder-gray-400"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            {mode === 'register' && (
                                <div className="input-group">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tum-blue/50 focus:border-tum-blue outline-none transition-all placeholder-gray-400"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="input-group password-row">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tum-blue/50 focus:border-tum-blue outline-none transition-all placeholder-gray-400"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {mode === 'register' && (
                                <div className="input-group confirm-group">
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tum-blue/50 focus:border-tum-blue outline-none transition-all placeholder-gray-400"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                style={{ backgroundColor: mode === 'login' ? 'var(--accent-color)' : 'var(--success-color)' }}
                            >
                                {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Create Account')}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase">Or</span>
                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            </div>

                            <button onClick={handleGuest} className="w-full py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Continue as Guest</button>

                            <div className="login-meta mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 text-xs text-center text-blue-800 dark:text-blue-200">
                                <p className="font-bold mb-1">🔒 Secure Authentication</p>
                                <p className="opacity-80">Powered by Neon & Vercel</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Section (right) */}
                    <div className="login-hero relative flex flex-col justify-center p-8 md:p-12 text-tum-dark dark:text-white" style={{ backgroundColor: 'var(--accent-color)', color: 'white' }}>
                        <div className="relative z-10">
                            <button type="button" className="tum-badge" aria-hidden="true" style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '20px', marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span>🚀</span>
                                <span className="tum-badge-text">Visually.</span>
                            </button>
                            <h3 className="text-3xl md:text-4xl font-display font-bold mb-4 leading-tight">Simulate <span className="text-transparent bg-clip-text bg-gradient-to-r from-tum-blue to-teal-400" style={{ color: 'white', textDecoration: 'underline' }}>smarter.</span></h3>
                            <p className="text-lg text-gray-200 dark:text-gray-300 mb-8 leading-relaxed">Run cache experiments with instant visuals, power insights, and guided help.</p>
                            <ul className="space-y-3 font-medium text-gray-200 dark:text-gray-200">
                                <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/30 text-green-100 text-sm">✓</span> Secure cloud auth</li>
                                <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/30 text-blue-100 text-sm">✓</span> History tracking</li>
                                <li className="flex items-center gap-3"><span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/30 text-purple-100 text-sm">✓</span> AI Chat assistance</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
