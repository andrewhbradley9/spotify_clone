import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Login = () => {
  return (
    <div className="login-page">
      <Header />
      <div className="login-container">
        <div className="form-container">
          <h2>Coog Music</h2>
          <form>
            <label>Email or username</label>
            <input type="email" placeholder="Enter your email" required />
            <label>Password</label>
            <input type="password" placeholder="Enter your password" required />
            <button type="submit">Login</button>
          </form>
          <p>
            Don’t have an account?{' '}
            <Link to="/regi" style={{ color: '#ff0000', textDecoration: 'underline' }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
