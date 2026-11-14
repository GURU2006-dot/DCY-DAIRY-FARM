import './env.js';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const email = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_INITIAL_PASSWORD;

try {
  if (!email || !password || email.includes('placeholder') || password.includes('placeholder')) {
    throw new Error('Set ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD in the server environment before initializing the first administrator.');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('ADMIN_INITIAL_EMAIL must be a valid email address.');
  if (password.length < 14) throw new Error('ADMIN_INITIAL_PASSWORD must be at least 14 characters long.');
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Use a password with upper and lower case letters, a number, and a symbol.');
  }
  const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
  if (existing.rowCount) throw new Error('An administrator already exists with this email. No account was changed.');
  const rounds = Math.min(15, Math.max(10, Number(process.env.BCRYPT_SALT_ROUNDS || 12)));
  const passwordHash = await bcrypt.hash(password, rounds);
  await pool.query('INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)', [email, passwordHash]);
  console.log('Administrator initialized successfully. Credentials were not logged.');
} catch (error) {
  console.error('Administrator initialization failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
