/**
 * One-off script: updates users table with bcrypt hash for password "password".
 * Run: npx ts-node -r tsconfig-paths/register scripts/update-seed-passwords.ts
 * Requires: DATABASE_URL in .env
 */
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

config({ path: ['.env.local', '.env'] });

const PASSWORD_HASH = bcrypt.hashSync('password', 10);
const EMAILS = ['buyer@mvp.local', 'provider@mvp.local', 'admin@mvp.local'];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Create .env with DATABASE_URL.');
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    url,
    synchronize: false,
  });

  await ds.initialize();

  for (const email of EMAILS) {
    await ds.query(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE email = $2`,
      [PASSWORD_HASH, email],
    );
    console.log(`Updated password for ${email}`);
  }

  // Verify: read back and test bcrypt
  const result = await ds.query(
    `SELECT email, password_hash FROM users WHERE email = $1`,
    ['buyer@mvp.local'],
  );
  await ds.destroy();

  const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] })?.rows ?? [];
  if (rows.length > 0) {
    const row = rows[0] as { email: string; password_hash: string };
    const ok = bcrypt.compareSync('password', row.password_hash);
    console.log(ok ? 'Verification: password "password" matches buyer@mvp.local.' : 'Verification FAILED: stored hash did not match "password".');
    if (!ok) console.log('Hash in DB starts with:', (row.password_hash || '').slice(0, 30));
  }
  console.log('Done. Login with email buyer@mvp.local and password "password".');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
