import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';


const apiUrl = process.env.REACT_APP_API_URL;

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('listener'); // Default role
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${apiUrl}/auth/register`, {
                username,
                password,
                email,
                role,
            });
            alert(response.data.message);
            navigate('/login'); // Redirect to login after successful registration
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Register</h1>
                <form onSubmit={handleRegister} className="auth-form">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="listener">Listener</option>
                        <option value="artist">Artist</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit">Register</button>
                    {error && <p className="auth-error">{error}</p>}
                </form>
                <div className="auth-switch">
                    <Link to="/login">Already have an account? Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
