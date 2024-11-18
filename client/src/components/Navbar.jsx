import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieve logged-in user information
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role'); // Retrieve role

    const handleLogout = () => {
        localStorage.clear(); // Clear all stored items
        navigate('/login'); // Redirect to the login page
    };

    // Check if the current page is /login or /register
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    // Don't render the Navbar on login or register pages
    if (isAuthPage) {
        return null;
    }

    return (
        <nav className="navbar">
            <div className="navbar-left">
                {/* Logo or Home link */}
                <Link to="/" className="logo">
                
                </Link>
            </div>

            <div className="navbar-right">
                {username ? (
                    <>
                        <span className="welcome-message">Welcome, {username} ({role})</span>
                        {role === 'admin' && (
                            <Link to="/admin-dashboard" className="admin-dashboard-link">
                                Admin Dashboard
                            </Link>
                        )}
                        <button onClick={handleLogout} className="logout-button">
                            Logout
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="login-button">
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
