// artistAuthRoutes.js
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import checkRole from '../middlewares/checkRole.js';

const router = express.Router();

// Artist-only route: Dashboard
router.get('/dashboard', authenticateToken, checkRole('artist'), (req, res) => {
    res.json({ message: 'Welcome to the artist dashboard!' });
});

// Create album
router.post("/albums/:artistId", authenticateToken, checkRole('artist'), (req, res) => {
    const query = 'INSERT INTO albums (album_name, release_date) VALUES (?)';
    const values = [req.body.album_name, req.body.release_date]; 

    db.query(query, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json("Album has been created woo!");
    });
});

// Other artist-specific routes can be added here

export default router;
