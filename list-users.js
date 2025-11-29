import pg from 'pg';

const { Pool } = pg;

const connectionString = "postgresql://neondb_owner:npg_GCk5XRSVA2YN@ep-little-waterfall-agx4qh53-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function listUsers() {
    try {
        const res = await pool.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC');
        console.log('--- Database Users ---');
        if (res.rows.length === 0) {
            console.log('No users found.');
        } else {
            console.table(res.rows);
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

listUsers();
