import query from './db.js';

export default async function handler(req, res) {
    try {
        // Check Env Vars
        const hasDbUrl = !!process.env.DATABASE_URL;
        const hasJwtSecret = !!process.env.JWT_SECRET;

        // Check DB Connection
        const start = Date.now();
        const dbResult = await query('SELECT NOW()');
        const duration = Date.now() - start;

        res.status(200).json({
            status: 'ok',
            env: {
                DATABASE_URL: hasDbUrl ? 'Set' : 'MISSING',
                JWT_SECRET: hasJwtSecret ? 'Set' : 'MISSING'
            },
            database: {
                connected: true,
                latency: `${duration}ms`,
                time: dbResult.rows[0].now
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            env: {
                DATABASE_URL: !!process.env.DATABASE_URL ? 'Set' : 'MISSING'
            }
        });
    }
}
