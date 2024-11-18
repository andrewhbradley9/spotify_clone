import express from 'express';
import mysql2 from 'mysql2';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();



// Create a MySQL connection pool
import dotenv from 'dotenv';

dotenv.config();

const db = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});





// Follow an artist
router.post('/user/:userId/follower/:artistId', authenticateToken(), async (req, res) => {
    const { userId, artistId } = req.params;

    try {
        console.log(`Follow request received for userId: ${userId}, artistId: ${artistId}`);

        // Check if already following
        const checkFollowQuery = `
            SELECT status 
            FROM Followers 
            WHERE followers_id = ? AND following_id = ?;
        `;
        console.log('Executing check follow query...');
        const [checkResult] = await db.promise().query(checkFollowQuery, [userId, artistId]);
        console.log('Check follow query result:', checkResult);

        if (checkResult.length > 0 && checkResult[0].status === 'following') {
            console.log('User is already following the artist.');
            return res.status(400).json({ message: 'You are already following this artist.' });
        }

        if (checkResult.length > 0 && checkResult[0].status === 'not_following') {
            // Reactivate the follow
            console.log('Updating status to following...');
            const reactivateFollowQuery = `
                UPDATE Followers 
                SET status = 'following', follow_date = NOW() 
                WHERE followers_id = ? AND following_id = ?;
            `;
            await db.promise().query(reactivateFollowQuery, [userId, artistId]);
        } else {
            // Insert a new follow record
            console.log('Inserting new follow record...');
            const followQuery = `
                INSERT INTO Followers (followers_id, following_id, follow_date, status) 
                VALUES (?, ?, NOW(), 'following');
            `;
            await db.promise().query(followQuery, [userId, artistId]);
        }

        // Increment the follower count
        console.log('Updating artist follower count...');
        const updateQuery = `
            UPDATE artist
            SET follower_count = follower_count + 1
            WHERE artist_id = ?;
        `;
        await db.promise().query(updateQuery, [artistId]);

        console.log('Follow operation completed successfully.');
        res.status(200).json({ message: 'Successfully followed artist.' });
    } catch (error) {
        console.error('Error during follow operation:', error);
        res.status(500).json({ message: 'Error following artist.' });
    }
});



// Unfollow an artist
// Unfollow an artist
router.post('/user/:userId/unfollow/:artistId', authenticateToken(), async (req, res) => {
    const { userId, artistId } = req.params;

    try {
        console.log(`Unfollow request received for userId: ${userId}, artistId: ${artistId}`);

        // Check if the user is actively following the artist
        const checkFollowQuery = `
            SELECT status FROM Followers WHERE followers_id = ? AND following_id = ?;
        `;
        console.log('Executing check follow query...');
        const [checkResult] = await db.promise().query(checkFollowQuery, [userId, artistId]);
        console.log('Check follow query result:', checkResult);

        if (checkResult.length === 0 || checkResult[0].status !== 'following') {
            console.log('User is not currently following the artist.');
            return res.status(400).json({ message: 'You are not following this artist.' });
        }

        // Update the follow status to 'not_following'
        console.log('Updating follow status to not_following...');
        const unfollowQuery = `
            UPDATE Followers 
            SET status = 'not_following' 
            WHERE followers_id = ? AND following_id = ?;
        `;
        await db.promise().query(unfollowQuery, [userId, artistId]);

        // Decrement the follower count
        console.log('Decrementing follower count...');
        const updateQuery = `
            UPDATE artist
            SET follower_count = follower_count - 1
            WHERE artist_id = ? AND follower_count > 0;
        `;
        await db.promise().query(updateQuery, [artistId]);

        console.log('Unfollow operation completed successfully.');
        res.status(200).json({ message: 'Successfully unfollowed artist.' });
    } catch (error) {
        console.error('Error unfollowing artist:', error);
        res.status(500).json({ message: 'Error unfollowing artist.' });
    }
});


// Check follow status
router.get('/user/:userId/follow-status/:artistId', authenticateToken(), async (req, res) => {
    const { userId, artistId } = req.params;

    try {
        const query = `
            SELECT status
            FROM Followers
            WHERE followers_id = ? AND following_id = ?;
        `;
        const [result] = await db.promise().query(query, [userId, artistId]);

        if (result.length > 0) {
            res.status(200).json({ status: result[0].status });
        } else {
            res.status(200).json({ status: 'not followed' });
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});


export default router;
