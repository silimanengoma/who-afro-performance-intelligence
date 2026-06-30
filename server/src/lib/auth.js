import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'dev-only-secret';

export function signUser(user) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name, centreCode: user.centre_code }, secret(), {
    expiresIn: '8h'
  });
}

export function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token.' });

  try {
    req.user = jwt.verify(token, secret());
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

export function requireImporter(req, res, next) {
  if (!['admin', 'pmo'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Only admin and PMO users can upload imports in Sprint 1.' });
  }
  return next();
}

export function requireSelectionEditor(req, res, next) {
  if (!['admin', 'pmo', 'team_lead'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Only Admin, PMO, and Team Lead users can edit Top 5 selections.' });
  }
  return next();
}
