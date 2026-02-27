import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Session check for persistence
        const savedUser = localStorage.getItem('nivaro_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('nivaro_user', JSON.stringify(userData));
        localStorage.setItem('nivaro_token', userData.token);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('nivaro_user');
        localStorage.removeItem('nivaro_token');
    };

    if (loading) return <div className="loading-screen">Nivaro Health Technologies...</div>;

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={!user ? <Login onLogin={handleLogin} /> : (
                        <Navigate to={`/${user.role}/dashboard`} />
                    )}
                />

                {/* Admin Strict Routes */}
                <Route
                    path="/admin/*"
                    element={user?.role === 'admin' ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* Doctor Strict Routes */}
                <Route
                    path="/doctor/*"
                    element={user?.role === 'doctor' ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                {/* Operator Strict Routes */}
                <Route
                    path="/operator/*"
                    element={user?.role === 'operator' ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
                />

                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
