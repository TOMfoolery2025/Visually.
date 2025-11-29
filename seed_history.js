import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        console.log('Connecting to database...');

        // 1. Get a user
        const userRes = await pool.query('SELECT id FROM users LIMIT 1');
        if (userRes.rows.length === 0) {
            console.log('No users found. Please register a user first.');
            return;
        }
        const userId = userRes.rows[0].id;
        console.log(`Found user: ${userId}`);

        // 2. Clear old history
        await pool.query('DELETE FROM history');
        console.log('Cleared old history.');

        // 3. Insert new sample history
        const sampleData = {
            config: {
                cacheSize: 1024,
                blockSize: 32,
                associativity: 2,
                replacementPolicy: 'LRU'
            },
            results: {
                instructions: 100,
                hitRate: '85.50%',
                hits: 85,
                misses: 15,
                accesses: 100
            }
        };

        await pool.query(
            'INSERT INTO history (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'Simulation Run', JSON.stringify(sampleData)]
        );
        console.log('Inserted sample simulation run.');

    } catch (err) {
        console.error('Error seeding history:', err);
    } finally {
        await pool.end();
    }
}

seed();
