const express = require('express');
const bcrypt = require('bcryptjs');
const userRepository = require('../db/userRepository');
const sessionStore = require('../session/sessionStore');
const requireSession = require('../middleware/requireSession');

const router = express.Router();
const COOKIE_NAME = 'sid';
const secureCookie = process.env.COOKIE_SECURE === 'true';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: secureCookie,
    sameSite: 'lax',
    signed: true,
    path: '/',
    maxAge: sessionStore.TTL_MS,
  };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = email ? await userRepository.findByEmail(email) : null;

    if (!user || !password || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const session = sessionStore.create(user.id);
    res.cookie(COOKIE_NAME, session.id, cookieOptions());
    return res.status(200).json({ data: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireSession, (req, res) => {
  res.status(200).json({ data: req.user });
});

router.post('/logout', (req, res) => {
  const sessionId = req.signedCookies && req.signedCookies[COOKIE_NAME];
  sessionStore.destroy(sessionId);
  const { maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie(COOKIE_NAME, clearOptions);
  return res.status(204).send();
});

module.exports = router;
