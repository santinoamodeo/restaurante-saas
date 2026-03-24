import psycopg2

conn = psycopg2.connect(
    "postgresql://neondb_owner:npg_dlKqMpJB2I8b@ep-morning-tooth-aczn81v8-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
)
conn.autocommit = True
cur = conn.cursor()

cur.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_day INTEGER")
cur.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS internal_notes TEXT")
cur.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_price INTEGER DEFAULT 0")
cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200)")
cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)")

print("OK")
cur.close()
conn.close()