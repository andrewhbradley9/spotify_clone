import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${apiUrl}/auth/login`, {
                username,
                password,
            });

            // Save authentication data to localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('artistId', response.data.artistId);
            localStorage.setItem('userId', response.data.userId);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('username', username);

            // Call the `onLogin` callback to update parent state
            if (onLogin) onLogin();

            // Redirect to the artist page
            navigate('/artist');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Login</h1>
                <form onSubmit={handleLogin} className="auth-form">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Login</button>
                    {error && <p className="auth-error">{error}</p>}
                </form>
                <div className="auth-switch">
                    <Link to="/register">Don't have an account? Register</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
