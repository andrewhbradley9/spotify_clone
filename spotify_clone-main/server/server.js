import express from 'express';
import cors from 'cors';
import cron  from 'node-cron';
import artistRoutes from './routes/artistRoutes.js';
import authRoute from './routes/authRoute.js';
//add multer and path
import multer from 'multer';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();



const app = express();
const PORT = process.env.PORT || 3360;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON requests

// Set Content Security Policy
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", 
        "default-src 'self'; " + // Allow resources from the same origin
        "font-src 'self' http://localhost:3360 data:; " + // Allow fonts from your server and data URLs
        "style-src 'self' 'unsafe-inline'; " + // Allow inline styles (use carefully)
        "script-src 'self' 'unsafe-inline' 'unsafe-eval';" // Allow inline scripts and eval (use carefully)
    );
    next();
});
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
// Use artist routes
app.use('/artists', artistRoutes); // Ensure this matches your routes correctly

// Use artist routes
app.use('/auth', authRoute);

app.get('/', (req, res) => {
    res.send("Backend if finally CI/CD");
});

//change begin
// Configure multer for file storage
/*const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Create an 'uploads' directory in your server
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Add this after your middleware setup
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//change end*/

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
