const { randomUUID } = require('node:crypto');

const TTL_MS = Number(process.env.SESSION_TTL_MS || 60 * 60 * 1000);
if (!Number.isSafeInteger(TTL_MS) || TTL_MS < 1) {
	throw new Error('SESSION_TTL_MS must be a positive integer');
}
const sessions = new Map();

function create(userId) {
	const session = {
		userId,
		expiresAt: new Date(Date.now() + TTL_MS),
	};
	const id = randomUUID();

	sessions.set(id, session);
	return { id, ...session };
}

function get(id) {
	if (typeof id !== 'string') return null;

	const session = sessions.get(id);
	if (!session) return null;

	if (session.expiresAt.getTime() <= Date.now()) {
		sessions.delete(id);
		return null;
	}

	return { ...session };
}

function destroy(id) {
	if (typeof id !== 'string') return false;
	return sessions.delete(id);
}

module.exports = { create, get, destroy, TTL_MS };
