# Deployment Guide

This application is designed to be deployed on platforms like **Vercel** (Serverless) or **Render/Railway** (Node.js Server).

## Option 1: Vercel (Recommended for Speed)

Vercel will automatically detect the Vite frontend and the Serverless Functions in the `api/` directory.

1.  **Push to GitHub**: Ensure your latest code is on GitHub.
2.  **Import in Vercel**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **Add New...** -> **Project**.
    *   Import your `PICKS` repository.
3.  **Configure Project**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (default)
    *   **Build Command**: `npm run build` (default)
    *   **Output Directory**: `dist` (default)
    *   **Environment Variables**: Add the following:
        *   `DATABASE_URL`: Your Neon PostgreSQL connection string (e.g., `postgres://user:pass@.../neondb?sslmode=require`)
        *   `JWT_SECRET`: A long random string for security.
4.  **Deploy**: Click **Deploy**.

**Note:** `vercel.json` is configured to route API requests to the `api/` folder and everything else to the React app.

---

## Option 2: Render / Railway (Recommended for Stability)

If Vercel gives you issues, you can deploy as a standard Node.js application using the included `server.js`. This runs the exact same server you use locally.

### Deploying on Render.com

1.  **Create Web Service**:
    *   Go to [Render Dashboard](https://dashboard.render.com/).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub repository.
2.  **Configuration**:
    *   **Runtime**: Node
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start` (This runs `node server.js`)
3.  **Environment Variables**:
    *   Add `DATABASE_URL` and `JWT_SECRET` (same as above).
4.  **Deploy**: Click **Create Web Service**.

This method uses `server.js`, which serves both the API and the compiled frontend from a single process.
