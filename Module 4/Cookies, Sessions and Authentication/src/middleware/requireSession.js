const userRepository = require('../db/userRepository');
const sessionStore = require('../session/sessionStore');

module.exports = async function requireSession(req, res, next) {
  const sessionId = req.signedCookies && req.signedCookies.sid;
  const session = sessionStore.get(sessionId);

  if (!session) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    });
  }

  const user = await userRepository.findPublicById(session.userId);
  if (!user) {
    sessionStore.destroy(sessionId);
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    });
  }

  req.user = user;
  return next();
};
