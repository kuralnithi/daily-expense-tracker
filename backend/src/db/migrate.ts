import 'dotenv/config';
import { pool, query } from './connection';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

const migrations = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'circle',
  color VARCHAR(20) DEFAULT '#6366f1',
  type VARCHAR(10) DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(10) DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  period VARCHAR(10) DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly')),
  month INTEGER CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
`;

interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

const defaultCategories: DefaultCategory[] = [
  { name: 'Food', icon: 'utensils', color: '#f97316', type: 'expense' },
  { name: 'Transport', icon: 'car', color: '#3b82f6', type: 'expense' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#a855f7', type: 'expense' },
  { name: 'Bills', icon: 'file-text', color: '#ef4444', type: 'expense' },
  { name: 'Entertainment', icon: 'tv', color: '#ec4899', type: 'expense' },
  { name: 'Health', icon: 'heart', color: '#10b981', type: 'expense' },
  { name: 'Education', icon: 'book', color: '#6366f1', type: 'expense' },
  { name: 'Salary', icon: 'briefcase', color: '#22c55e', type: 'income' },
  { name: 'Other', icon: 'circle', color: '#94a3b8', type: 'expense' },
];

async function seedDefaultCategories(userId: string): Promise<void> {
  for (const cat of defaultCategories) {
    await query(
      `INSERT INTO categories (user_id, name, icon, color, type, is_default)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT DO NOTHING`,
      [userId, cat.name, cat.icon, cat.color, cat.type]
    );
  }
  console.log(`✅ Default categories seeded for user ${userId}`);
}

async function migrate(): Promise<void> {
  console.log('🔄 Running database migrations...');

  try {
    // Run table creation
    await pool.query(migrations);
    console.log('✅ Tables created successfully');

    // Insert default user if not exists
    await query(
      `INSERT INTO users (id, name, email, currency)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [DEFAULT_USER_ID, 'Default User', 'user@example.com', 'INR']
    );
    console.log('✅ Default user ensured');

    // Check if default user already has categories
    const catCheck = await query(
      'SELECT COUNT(*) as count FROM categories WHERE user_id = $1',
      [DEFAULT_USER_ID]
    );
    const count = parseInt((catCheck.rows[0] as { count: string }).count, 10);

    if (count === 0) {
      await seedDefaultCategories(DEFAULT_USER_ID);
    } else {
      console.log(`ℹ️  Default categories already exist (${count} found)`);
    }

    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});

export { seedDefaultCategories };
