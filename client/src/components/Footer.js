import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>About Coog Music</h4>
          <p>
            Coog Music is your go-to platform for discovering, streaming, and sharing a wide range of music from artists around the world. Join our community and explore endless music possibilities.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/register">Create Account</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><a href="#">For Artists</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">FAQs</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="#"><i className="fab fa-facebook"></i> Facebook</a>
            <a href="#"><i className="fab fa-twitter"></i> Twitter</a>
            <a href="#"><i className="fab fa-instagram"></i> Instagram</a>
            <a href="#"><i className="fab fa-youtube"></i> YouTube</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2024 Coog Music. All Rights Reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a> | <a href="#">Legal</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
