import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env.local') })
import bcrypt from 'bcryptjs'
import postgres from 'postgres'

function sanitizeConnectionString(url) {
  if (!url) return ''
  try {
    new URL(url)
    return url
  } catch {
    const match = url.match(/^(postgresql:\/\/)([^:]+):(.*)@([^:/]+)(:\d+)?\/(.+)$/)
    if (match) {
      return `${proto}${user}:${encodeURIComponent(decodeURIComponent(pass))}@${host}${port || ':5432'}/${db}`
    }
    return url
  }
}

const connectionString = sanitizeConnectionString(process.env.DATABASE_URL)
const sql = postgres(connectionString, { ssl: 'require' })

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase()
  const plainPassword = process.env.ADMIN_PASSWORD || 'Admin@123'
  const fullName = process.env.ADMIN_NAME || 'System Administrator'
  const phoneNumber = process.env.ADMIN_PHONE || '+919999999999'

  console.log(`🔒 Hashing admin password for [${email}]...`)
  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  // Ensure necessary columns exist in admin_profiles table
  await sql`ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS user_id UUID;`
  await sql`ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS hashed_password TEXT;`
  await sql`ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;`
  await sql`ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'System Administrator';`
  await sql`ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';`
  await sql`ALTER TABLE public.admin_profiles ALTER COLUMN password_hash DROP NOT NULL;`

  // Directly provision admin in admin_profiles table
  const [admin] = await sql`
    INSERT INTO public.admin_profiles (
      email,
      hashed_password,
      password_hash,
      full_name,
      role
    )
    VALUES (
      ${email},
      ${hashedPassword},
      ${hashedPassword},
      ${fullName},
      'admin'
    )
    ON CONFLICT (email) DO UPDATE SET
      hashed_password = EXCLUDED.hashed_password,
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = 'admin',
      updated_at = NOW()
    RETURNING id, user_id, email, full_name, role, created_at;
  `

  console.log('✅ Successfully provisioned admin in admin_profiles table:')
  console.log(`   Admin Profile ID: ${admin.id}`)
  console.log(`   Email:            ${admin.email}`)
  console.log(`   Full Name:        ${admin.full_name}`)
  console.log(`   Role:             ${admin.role}`)

  await sql.end()
}

seedAdmin().catch((err) => {
  console.error('❌ Failed to seed admin:', err)
  process.exit(1)
})
