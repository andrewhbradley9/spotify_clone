import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import artistRoutes from './routes/artistRoutes.js';
import authRoute from './routes/authRoute.js';
import songRoutes from './routes/songRoutes.js';
import followerRoute from './routes/followerRoute.js'
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3360;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`Received ${req.method} request on ${req.url}`);
    next();
});

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
app.use('/artists', artistRoutes);
app.use('/auth', authRoute);
app.use('/song', songRoutes);
app.use('/follow', followerRoute);

// Root endpoint
app.get('/', (req, res) => {
    res.send("Backend is running");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});