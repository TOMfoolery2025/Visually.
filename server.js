import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Database Pool
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const query = async (text, params) => {
    return await pool.query(text, params);
};

// --- API Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    try {
        const userCheck = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ error: 'Username or Email already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const result = await query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, created_at',
            [username, email, hash]
        );

        res.status(201).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token,
            user: { id: user.id, username: user.username }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// History
app.all('/api/history', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    let user;
    try {
        user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod');
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (req.method === 'GET') {
        try {
            const result = await query(
                'SELECT * FROM history WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 50',
                [user.userId]
            );
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Fetch history error:', error);
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    } else if (req.method === 'POST') {
        const { action, details } = req.body;
        if (!action) return res.status(400).json({ error: 'Action is required' });

        try {
            const result = await query(
                'INSERT INTO history (user_id, action, details) VALUES ($1, $2, $3) RETURNING *',
                [user.userId, action, details || '']
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Log history error:', error);
            res.status(500).json({ error: 'Failed to log history' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
});

// Health
app.get('/api/health', async (req, res) => {
    try {
        const start = Date.now();
        const dbResult = await query('SELECT NOW()');
        const duration = Date.now() - start;
        res.status(200).json({
            status: 'ok',
            database: { connected: true, latency: `${duration}ms` }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: ONLY for non-file requests (no extension)
app.get(/.*/, (req, res) => {
    if (req.url.includes('.')) {
        return res.status(404).send('Not Found');
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
