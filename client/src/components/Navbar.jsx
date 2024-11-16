import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieve logged-in user information
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

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
            <div className="navbar-right">
                <Link to="/artist" className="logo">
                    
                </Link>
            </div>
            <div className="navbar-right">
                {username && (
                    <>
                        <span>Welcome, {username} ({role})</span>
                        <button onClick={handleLogout} className="logout-button">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
