-- Enable RLS on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Policies for 'profiles' table
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);


-- ----------------------------------------------------
-- Policies for 'transactions' table
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions" 
ON transactions FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
CREATE POLICY "Users can delete own transactions" 
ON transactions FOR DELETE 
USING (auth.uid() = user_id);


-- ----------------------------------------------------
-- Policies for 'categories' table
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view own categories" 
ON categories FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories" 
ON categories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories" 
ON categories FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories" 
ON categories FOR DELETE 
USING (auth.uid() = user_id);


-- ----------------------------------------------------
-- Policies for 'accounts' table
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
CREATE POLICY "Users can view own accounts" 
ON accounts FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
CREATE POLICY "Users can insert own accounts" 
ON accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
CREATE POLICY "Users can update own accounts" 
ON accounts FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
CREATE POLICY "Users can delete own accounts" 
ON accounts FOR DELETE 
USING (auth.uid() = user_id);
