/**
 * Role-Based Access Control middleware.
 * Usage: router.get('/route', requireRole('admin', 'billing'), controller)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: 'No role assigned to this user' });
    }
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.userRole}`,
      });
    }
    next();
  };
}

/**
 * Admin-only shorthand
 */
export const adminOnly = requireRole('admin');
