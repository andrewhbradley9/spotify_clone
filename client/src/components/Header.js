import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <Link to="/" className="logo">
        Coog Music
      </Link>
      <nav className="nav">
        <Link to="/login">
          <button className="nav-btn">Sign In</button>
        </Link>
        <Link to="/register">
          <button className="nav-btn highlight">Create Account</button>
        </Link>
       
      </nav>
    </header>
  );
};

export default Header;
