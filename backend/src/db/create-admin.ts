import bcrypt from 'bcryptjs';
import { pool } from './pool';

const username = process.env.ADMIN_USER || 'admin';
const email    = process.env.ADMIN_EMAIL || 'admin@crossword-kn.local';
const password = process.env.ADMIN_PASS  || 'Admin@1234';

async function createAdmin() {
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = 'admin'
     RETURNING id, username, email, role`,
    [username, email, hash]
  );
  console.log('Admin user ready:', rows[0]);
  await pool.end();
}

createAdmin().catch(err => { console.error(err); process.exit(1); });
