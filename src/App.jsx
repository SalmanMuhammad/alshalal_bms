import React, { useState, useEffect, useRef, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import QuotationApp from './components/QuotationApp';
import QuotationList from './components/QuotationList';
import AttendanceHRSystem from './components/AttendanceHRSystem';
import Login from './components/Login';
import { authAPI } from './utils/api';

// Session timeout configuration (in milliseconds)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout

function App() {
    const [currentView, setCurrentView] = useState('login');
    const [quotationId, setQuotationId] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInactivityWarning, setShowInactivityWarning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    
    const inactivityTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const countdownIntervalRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('user');
            
            if (token && storedUser) {
                try {
                    // Verify token is still valid
                    const userData = await authAPI.getMe();
                    setUser(userData);
                    setCurrentView('landing');
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    setCurrentView('login');
                }
            } else {
                setCurrentView('login');
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        setCurrentView('landing');
    };

    const handleLogout = useCallback(() => {
        // Clear timers
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        
        // Clear storage and state
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        setCurrentView('login');
        setShowInactivityWarning(false);
        setTimeRemaining(0);
    }, []);

    // Reset inactivity timer on user activity
    const resetInactivityTimer = useCallback(() => {
        if (!user) return; // Only track if user is logged in
        
        lastActivityRef.current = Date.now();
        setShowInactivityWarning(false);
        setTimeRemaining(0);
        
        // Clear existing timers
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        
        // Set warning timer (5 minutes before logout)
        warningTimerRef.current = setTimeout(() => {
            const warningStartTime = Date.now();
            setTimeRemaining(Math.floor(WARNING_TIME / 1000)); // Start with full warning time
            setShowInactivityWarning(true);
            
            // Update countdown every second
            countdownIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - warningStartTime;
                const remaining = Math.max(0, WARNING_TIME - elapsed);
                setTimeRemaining(Math.floor(remaining / 1000));
                
                if (remaining <= 0) {
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                        countdownIntervalRef.current = null;
                    }
                }
            }, 1000);
            
            // Set logout timer - should be WARNING_TIME (5 minutes) from now, not INACTIVITY_TIMEOUT
            inactivityTimerRef.current = setTimeout(() => {
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }
                alert('Your session has expired due to inactivity. You will be logged out.');
                handleLogout();
            }, WARNING_TIME); // Logout after WARNING_TIME (5 minutes) from when warning shows
        }, INACTIVITY_TIMEOUT - WARNING_TIME);
    }, [user, handleLogout]);

    // Track user activity
    useEffect(() => {
        if (!user) return;
        
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const handleActivity = () => {
            resetInactivityTimer();
        };
        
        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity, true);
        });
        
        // Initialize timer
        resetInactivityTimer();
        
        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity, true);
            });
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
            if (warningTimerRef.current) {
                clearTimeout(warningTimerRef.current);
                warningTimerRef.current = null;
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
        };
    }, [user, resetInactivityTimer]);

    const handleNavigate = (view, id = null) => {
        // Check role-based access
        if (view === 'quotation' || view === 'quotation-list') {
            if (user?.role !== 'admin') {
                alert('Access denied. Admin role required.');
                return;
            }
        }
        setCurrentView(view);
        setQuotationId(id);
    };

    const handleEditQuotation = (id) => {
        if (user?.role !== 'admin') {
            alert('Access denied. Admin role required.');
            return;
        }
        setQuotationId(id);
        setCurrentView('quotation');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    const handleStayLoggedIn = () => {
        resetInactivityTimer();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* Inactivity Warning Modal */}
            {showInactivityWarning && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Session Timeout Warning</h3>
                            <p className="text-slate-600 mb-4">
                                You have been inactive for a while. Your session will expire in:
                            </p>
                            <div className="text-4xl font-bold text-amber-600 mb-6">
                                {formatTime(timeRemaining)}
                            </div>
                            <p className="text-sm text-slate-500 mb-6">
                                Click "Stay Logged In" to continue your session.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-semibold transition-all duration-200"
                                >
                                    Logout Now
                                </button>
                                <button
                                    onClick={handleStayLoggedIn}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    Stay Logged In
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
            {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />}
            {currentView === 'quotation' && user?.role === 'admin' && <QuotationApp onNavigate={handleNavigate} quotationId={quotationId} user={user} onLogout={handleLogout} />}
            {currentView === 'quotation-list' && user?.role === 'admin' && <QuotationList onNavigate={handleNavigate} onEditQuotation={handleEditQuotation} user={user} onLogout={handleLogout} />}
            {currentView === 'attendance' && <AttendanceHRSystem onNavigate={handleNavigate} user={user} onLogout={handleLogout} />}
        </>
    );
}

export default App;

