import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

(async () => {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,  // Use environment variables
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log('Connecting to the database...');

        // Fetch all users with plaintext passwords
        const [users] = await db.query('SELECT user_id, password FROM User');

        for (const user of users) {
            // Skip if password is already hashed (bcrypt hashes start with '$2b$')
            if (user.password.startsWith('$2b$')) {
                console.log(`User ID ${user.user_id} already has a hashed password. Skipping...`);
                continue;
            }

            // Hash the plaintext password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Update the database with the hashed password
            await db.query('UPDATE User SET password = ? WHERE user_id = ?', [
                hashedPassword,
                user.user_id,
            ]);

            console.log(`Password for User ID ${user.user_id} hashed successfully.`);
        }

        console.log('All plaintext passwords have been hashed successfully!');
    } catch (error) {
        console.error('Error during password hashing:', error);
    } finally {
        db.end();
    }
})();
