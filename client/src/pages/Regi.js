import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Regi = () => {
  return (
    <div className="register-page">
      <Header />
      <div className="register-container">
        <div className="form-container">
          <h2>Coog Music</h2>
          <form>
            <label>Name</label>
            <input type="text" placeholder="Enter your name" required />
            <label>Email</label>
            <input type="email" placeholder="Enter your email" required />
            <label>Password</label>
            <input type="password" placeholder="Enter your password" required />
            <label>Confirm Password</label>
            <input type="password" placeholder="Confirm your password" required />
            <button type="submit">Register</button>
          </form>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#ff0000', textDecoration: 'underline' }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Regi;
