// server.js
import express from 'express';
import cors from 'cors';
import artistRoutes from './routes/artistRoutes.js';
const app = express();
const PORT = 3360;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON requests

// Use artist routes
app.use('/artists', artistRoutes); // Ensure this matches your routes correctly

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on !! http://localhost:${PORT}`);
});
