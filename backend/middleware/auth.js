import { supabase } from '../config/supabase.js';

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches user & role to req for use in controllers.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    // Fetch user's role from DB
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single();

    req.user = user;
    req.userRole = roleData?.roles?.name || null;
    next();
  } catch (err) {
    next(err);
  }
}
