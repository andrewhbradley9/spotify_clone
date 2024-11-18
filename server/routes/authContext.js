// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';

// Create a context for authentication
export const AuthContext = createContext();

// AuthProvider component to wrap around the app
export const AuthProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwt_decode(token);
                setUserRole(decodedToken.role);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Invalid token');
                setIsAuthenticated(false);
            }
        }
    }, []);

    return (
        <AuthContext.Provider value={{ userRole, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
