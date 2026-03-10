import React, { useState } from 'react';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { authAPI } from '../utils/api';

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await authAPI.login(username, password);
            
            // Store token and user info
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            // Call success callback
            onLoginSuccess(response.user);
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #e0e7ff, #f4f4fb)' }}>
            <div className="max-w-md w-full">
                <div className="bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-12 text-white">
                        <div className="flex flex-col items-center gap-6 mb-8">
                            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-6 flex items-center justify-center shadow-lg">
                                <img src="/company_logo.png" alt="Company Logo" className="w-24 h-auto object-contain drop-shadow-lg" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
                                <p className="text-blue-100 text-sm">Sign in to access your account</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-500/20 border border-red-300/50 text-red-100 px-4 py-3 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="username" className="block text-sm font-semibold text-blue-100 mb-2">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 transition-all"
                                    placeholder="Enter your username"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-blue-100 mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 transition-all"
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-blue-900 px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/20 text-center">
                            <p className="text-blue-200 text-xs">
                                AMAL SAAD SULAIMAN AL-SUBHI TRADING & EST.
                            </p>
                            <p className="text-blue-300 text-xs mt-1">
                                VAT NO. 310320454300003 · CR: 40326322
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;

