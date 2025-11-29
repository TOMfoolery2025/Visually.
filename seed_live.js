import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Use the connection string from .env (which should be your Neon DB)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedLive() {
    try {
        console.log('Connecting to LIVE database...');

        // 1. Get the most recent user (likely the one you just logged in as)
        const userRes = await pool.query('SELECT id, username FROM users ORDER BY created_at DESC LIMIT 1');

        if (userRes.rows.length === 0) {
            console.log('No users found! Please register on the website first.');
            return;
        }

        const user = userRes.rows[0];
        console.log(`Seeding data for user: ${user.username} (${user.id})`);

        // 2. Prepare the sample data (The "Perfect" Entry)
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

        // 3. Insert it
        await pool.query(
            'INSERT INTO history (user_id, action, details) VALUES ($1, $2, $3)',
            [user.id, 'Simulation Run', JSON.stringify(sampleData)]
        );

        console.log('✅ SUCCESS! Added sample history entry.');
        console.log('👉 Go refresh your website now!');

    } catch (err) {
        console.error('❌ Error seeding:', err);
    } finally {
        await pool.end();
    }
}

seedLive();
