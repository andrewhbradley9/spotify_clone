import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import artistRoutes from './routes/artistRoutes.js';
import authRoute from './routes/authRoute.js';
import songRoutes from './routes/songRoutes.js';
import followerRoute from './routes/followerRoute.js'
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';

import  { authenticateToken } from './middlewares/authMiddleware.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3360;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON requests

app.use((req, res, next) => {
    console.log(`Received ${req.method} request on ${req.url}`);
    next();
});



// Serve static files from the React app's build directory
const __dirname = path.resolve(); // Ensures compatibility with ES modules
app.use(express.static(path.join(__dirname, 'client/build')));

// Cron job for resetting play counts
cron.schedule('0 0 1 * *', () => {
    console.log('Running monthly play count reset...');
    db.query('UPDATE song SET play_count = 0 WHERE play_count > 0', (err, result) => {
        if (err) {
            console.error("Error resetting play counts:", err);
        } else {
            console.log("Monthly play counts reset successfully:", result.affectedRows);
        }
    });
});

// Routes
app.use('/artists', artistRoutes); // Artist routes
app.use('/auth', authRoute); // Authentication routes
app.use('/song', songRoutes); // Song routes
app.use('/follow', followerRoute); // follower routes

// Serve React app for all unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Root endpoint (optional)
app.get('/', (req, res) => {
    res.send("Backend is finally CI/CD + Andrew testing hehe");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});