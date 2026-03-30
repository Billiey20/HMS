import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const env = fs.readFileSync(path.resolve('../.env'), 'utf8')
  .split('\n')
  .filter(line => line.includes('='))
  .reduce((acc, line) => {
    const [key, ...value] = line.split('=');
    acc[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
    return acc;
  }, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in root .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createInitialAdmin() {
  const email = 'admin@hospital.com';
  const password = 'password123';
  const firstName = 'System';
  const lastName = 'Admin';

  console.log(`🚀 Creating initial admin user: ${email}...`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.warn('⚠️ User already exists. Checking profile...');
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === email);
      if (existingUser) authData.user = existingUser;
    } else {
      console.error('❌ Error creating Auth user:', authError.message);
      return;
    }
  }

  const userId = authData.user.id;
  console.log(`✅ Auth user ready (ID: ${userId})`);

  const { error: profileError } = await supabase.from('users').upsert({
    id: userId, first_name: firstName, last_name: lastName, email, employee_no: 'ADMIN-001'
  });
  if (profileError) { console.error('❌ Error creating profile:', profileError.message); return; }
  console.log('✅ Profile created in public.users');

  const { data: roleData, error: roleFetchError } = await supabase
    .from('roles').select('id').eq('name', 'admin').single();
  if (roleFetchError) { console.error('❌ Error fetching admin role:', roleFetchError.message); return; }

  const { error: roleAssignError } = await supabase.from('user_roles')
    .upsert({ user_id: userId, role_id: roleData.id });
  if (roleAssignError) { console.error('❌ Error assigning role:', roleAssignError.message); return; }

  console.log(`\n🎉 Success! You can now log in with:`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
}

createInitialAdmin();
