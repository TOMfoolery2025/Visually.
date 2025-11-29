import jwt from 'jsonwebtoken';
import query from './db.js';

// Helper to verify token
const verifyToken = (req) => {
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod');
        console.log('Token verified for user:', decoded.userId);
        return decoded;
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return null;
    }
};

export default async function handler(req, res) {
    console.log(`History API called: ${req.method}`);

    // Disable caching to ensure fresh history is always fetched
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const user = verifyToken(req);
    if (!user || !user.userId) {
        console.log('Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        console.log('Fetching history for user:', user.userId);
        try {
            const result = await query(
                'SELECT * FROM history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50',
                [user.userId]
            );
            console.log(`Found ${result.rows.length} history items`);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Fetch history error:', error);
            res.status(500).json({ error: 'Failed to fetch history: ' + error.message });
        }
    } else if (req.method === 'POST') {
        console.log('History POST received');
        let body = req.body;

        console.log('Raw body type:', typeof body);
        console.log('Raw body:', body);

        // Robust parsing for Vercel serverless environment
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.error('Failed to parse body:', e);
                return res.status(400).json({ error: 'Invalid JSON body' });
            }
        }

        const { action, details } = body || {};
        console.log('Parsed action:', action);

        if (!action) {
            return res.status(400).json({ error: 'Action is required' });
        }

        try {
            const result = await query(
                'INSERT INTO history (user_id, action, details) VALUES ($1, $2, $3) RETURNING *',
                [user.userId, action, details || '']
            );
            console.log('Insert success:', result.rows[0].id);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Log history error:', error);
            res.status(500).json({ error: 'Failed to log history: ' + error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
