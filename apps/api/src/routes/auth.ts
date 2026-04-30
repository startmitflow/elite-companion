import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';

const pool = getPool();

const router = Router();

// Configure Google OAuth
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const callbackURL = process.env.NODE_ENV === 'production'
  ? `${process.env.API_URL || 'https://elite-companion-api.onrender.com'}/auth/google/callback`
  : '/auth/google/callback';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [profile.emails?.[0]?.value]
      );

      let user = result.rows[0];

      if (!user) {
        const insertResult = await pool.query(
          'INSERT INTO users (email, display_name, avatar_url) VALUES ($1, $2, $3) RETURNING *',
          [
            profile.emails?.[0]?.value,
            profile.displayName,
            profile.photos?.[0]?.value,
          ]
        );
        user = insertResult.rows[0];

        await pool.query(
          'INSERT INTO user_settings (user_id) VALUES ($1)',
          [user.id]
        );
      }

      await pool.query(
        'INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token, refresh_token) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, provider) DO UPDATE SET access_token = $4, refresh_token = $5',
        [user.id, 'google', profile.id, accessToken, refreshToken]
      );

      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));
}

// Configure Discord OAuth
import { Strategy as DiscordStrategy } from 'passport-discord';

const discordCallbackURL = process.env.NODE_ENV === 'production'
  ? `${process.env.API_URL || 'https://elite-companion-api.onrender.com'}/auth/discord/callback`
  : '/auth/discord/callback';

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: discordCallbackURL,
    scope: ['identify', 'email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.email;
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      let user = result.rows[0];

      if (!user) {
        const insertResult = await pool.query(
          'INSERT INTO users (email, display_name, avatar_url) VALUES ($1, $2, $3) RETURNING *',
          [
            email,
            `${profile.username}#${profile.discriminator}`,
            `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
          ]
        );
        user = insertResult.rows[0];

        await pool.query(
          'INSERT INTO user_settings (user_id) VALUES ($1)',
          [user.id]
        );
      }

      await pool.query(
        'INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token, refresh_token) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, provider) DO UPDATE SET access_token = $4, refresh_token = $5',
        [user.id, 'discord', profile.id, accessToken, refreshToken]
      );

      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

router.use(passport.initialize());

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const user = req.user as any;
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

// Discord OAuth routes
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', passport.authenticate('discord', { session: false }), (req, res) => {
  const user = req.user as any;
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// Generate API token for desktop agent
router.post('/token', authenticate, async (req: any, res) => {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('base64url');

  try {
    // Store the token (in production, you'd store this hashed)
    await pool.query(
      'UPDATE users SET api_token = $1 WHERE id = $2',
      [token, req.userId]
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const result = await pool.query(
      'SELECT id, email, display_name, avatar_url, commander_name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;