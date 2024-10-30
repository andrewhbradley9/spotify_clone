import express from 'express';
import cors from 'cors';
import artistRoutes from './routes/artistRoutes.js';
import authRoute from './routes/authRoute.js'; // Import the auth routes

const app = express();
const PORT = process.env.PORT || 3360; // Use environment-provided port or default to 3360 for local dev

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON requests

// Use artist routes
app.use('/artists', artistRoutes); // Ensure this matches your routes correctly

// Use authentication routes
app.use('/auth', authRoute); // This will route to your authentication endpoints (e.g., /auth/register and /auth/login)

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!!`);
});
