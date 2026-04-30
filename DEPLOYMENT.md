# Elite Dangerous Companion - Render Deployment Guide

## Quick Deploy with render.yaml (Blueprint)

1. Push code to GitHub
2. Go to https://dashboard.render.com/blueprints
3. Click **New Blueprint Instance**
4. Connect your GitHub repo
5. Render will detect `render.yaml` and create:
   - PostgreSQL database
   - API web service
   - Frontend static site
6. Add your OAuth credentials as environment variables
7. Deploy!

## Manual Deployment Steps

### 1. Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - Name: `elite-companion-db`
   - Database: `elite_companion`
   - User: `elite`
   - Select **Free** tier (or paid for production)
3. Copy the **Internal Database URL**

### 2. Deploy Backend API

1. **New** → **Web Service**
2. Connect GitHub repo
3. Configure:
   - Name: `elite-companion-api`
   - Root Directory: `apps/api`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (from PostgreSQL Internal URL) |
| `JWT_SECRET` | `random-secret-string-here` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://elite-companion.onrender.com` |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Secret |
| `DISCORD_CLIENT_ID` | Your Discord Client ID |
| `DISCORD_CLIENT_SECRET` | Your Discord Secret |

5. **Create Web Service**

### 3. Deploy Frontend

1. **New** → **Static Site**
2. Connect GitHub repo
3. Configure:
   - Name: `elite-companion`
   - Root Directory: `apps/web`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://elite-companion-api.onrender.com`
5. **Create Static Site**

### 4. Configure OAuth Redirect URLs

Update your OAuth providers with your Render URLs:

**Google Cloud Console:**
- Add authorized redirect: `https://elite-companion-api.onrender.com/auth/google/callback`

**Discord Developer Portal:**
- Add redirect: `https://elite-companion-api.onrender.com/auth/discord/callback`

### 5. Add Rewrite Rules (Frontend)

In the frontend static site settings, add these rewrite rules:

| Source | Destination |
|--------|-------------|
| `/api/*` | `https://elite-companion-api.onrender.com/api/*` |
| `/auth/*` | `https://elite-companion-api.onrender.com/auth/*` |
| `/socket.io/*` | `https://elite-companion-api.onrender.com/socket.io/*` |
| `/*` | `/index.html` (for SPA routing) |

## Post-Deployment

1. Visit your frontend URL: `https://elite-companion.onrender.com`
2. Login with Google or Discord
3. Go to Settings → Generate API Token
4. Use the token in your desktop agent

## Desktop Agent Setup

The desktop agent runs locally on your PC and syncs journal files:

1. Download the app from your Render URL
2. Go to Settings → Generate API Token
3. Run the desktop agent locally:
   ```powershell
   cd apps/desktop
   npm install
   npm run build
   npm start
   ```
4. Paste your API token when prompted

## Troubleshooting

### API Not Starting
- Check logs in Render dashboard
- Verify DATABASE_URL is set correctly
- Ensure all OAuth variables are set

### Database Connection Issues
- Make sure PostgreSQL is in the same region as your web service
- Use Internal Database URL (not External)

### OAuth Not Working
- Double-check redirect URLs match exactly
- Ensure CLIENT_ID and CLIENT_SECRET are correct
- Verify FRONTEND_URL matches your frontend URL

### Frontend Can't Connect to API
- Check VITE_API_URL is set to your API URL
- Verify rewrite rules are configured
- Check CORS settings in the API