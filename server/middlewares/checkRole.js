const checkRole = (role) => {
    return (req, res, next) => {
        // Check if the user role matches the required role
        if (req.user.role !== role) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to access this route.' });
        }
        next(); // Proceed if roles match
    };
};

export default checkRole;