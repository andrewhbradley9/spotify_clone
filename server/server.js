import express from 'express';
import cors from 'cors';
import artistRoutes from './routes/artistRoutes.js';

const app = express();
const PORT = process.env.PORT || 3360; // Use environment-provided port or default to 3360 for local dev

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON requests

// Use artist routes
app.use('/artists', artistRoutes); // Ensure this matches your routes correctly

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
});
